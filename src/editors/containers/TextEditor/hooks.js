import {
  useRef, useEffect, useCallback, useState,
} from 'react';

import { useSelector } from 'react-redux';
import { StrictDict } from '../../utils';
import tinyMCE from '../../data/constants/tinyMCE';
import tinyMCEStyles from '../../data/constants/tinyMCEStyles';
import pluginConfig from './pluginConfig';
import * as appHooks from '../../hooks';
import * as module from './hooks';
import { selectors } from '../../data/redux';

export const { nullMethod, navigateCallback, navigateTo } = appHooks;

export const state = StrictDict({
  isImageModalOpen: (val) => useState(val),
  isSourceCodeModalOpen: (val) => useState(val),
  imageSelection: (val) => useState(val),
  refReady: (val) => useState(val),
});

export const setupCustomBehavior = ({
  openImgModal,
  openSourceCodeModal, setImage,
}) => (editor) => {
  // image upload button
  editor.ui.registry.addButton(tinyMCE.buttons.imageUploadButton, {
    icon: 'image',
    tooltip: 'Add Image',
    onAction: openImgModal,
  });
  // editing an existing image
  editor.ui.registry.addButton(tinyMCE.buttons.editImageSettings, {
    icon: 'image',
    tooltip: 'Edit Image Settings',
    onAction: module.openModalWithSelectedImage({ editor, setImage, openImgModal }),
  });
  // overriding the code plugin's icon with 'HTML' text
  editor.ui.registry.addButton(tinyMCE.buttons.code, {
    text: 'HTML',
    tooltip: 'Source code',
    onAction: openSourceCodeModal,
  });
  // add a custom simple inline code block formatter.
  const setupCodeFormatting = (api) => {
    editor.formatter.formatChanged(
      'code',
      (active) => api.setActive(active),
    );
  };
  const toggleCodeFormatting = () => {
    editor.formatter.toggle('code');
    editor.undoManager.add();
    editor.focus();
  };
  editor.ui.registry.addToggleButton(tinyMCE.buttons.codeBlock, {
    icon: 'sourcecode',
    tooltip: 'Code Block',
    onAction: toggleCodeFormatting,
    onSetup: setupCodeFormatting,
  });
};

export const replaceStaticwithAsset = (editor, imageUrls) => {
  const content = editor.getContent();
  const imageSrcs = content.split('src="');
  imageSrcs.forEach(src => {
    if (src.startsWith('/static/') && imageUrls.length > 0) {
      const imgName = src.substring(8, src.indexOf('"'));
      let staticFullUrl;
      imageUrls.forEach((url) => {
        if (imgName === url.displayName) {
          staticFullUrl = url.staticFullUrl;
        }
      });
      if (staticFullUrl) {
        const currentSrc = src.substring(0, src.indexOf('"'));
        const updatedContent = content.replace(currentSrc, staticFullUrl);
        editor.setContent(updatedContent);
      }
    }
  });
};

export const checkRelativeUrl = (imageUrls) => (editor) => {
  editor.on('ExecCommand', (e) => {
    if (e.command === 'mceFocus') {
      module.replaceStaticwithAsset(editor, imageUrls);
    }
  });
};

// imagetools_cors_hosts needs a protocol-sanatized url
export const removeProtocolFromUrl = (url) => url.replace(/^https?:\/\//, '');

export const editorConfig = ({
  blockValue,
  initializeEditor,
  lmsEndpointUrl,
  openImgModal,
  openSourceCodeModal,
  setEditorRef,
  setSelection,
  studioEndpointUrl,
  images,
  isLibrary,
}) => ({
  onInit: (evt, editor) => {
    setEditorRef(editor);
    initializeEditor();
  },
  initialValue: blockValue ? blockValue.data.data : '',
  init: {
    ...pluginConfig(isLibrary).config,
    skin: false,
    content_css: false,
    content_style: tinyMCEStyles,
    contextmenu: 'link table',
    document_base_url: lmsEndpointUrl,
    init_instance_callback: module.checkRelativeUrl(module.fetchImageUrls(images)),
    imagetools_cors_hosts: [removeProtocolFromUrl(lmsEndpointUrl), removeProtocolFromUrl(studioEndpointUrl)],
    imagetools_toolbar: pluginConfig(isLibrary).imageToolbar,
    plugins: pluginConfig(isLibrary).plugins,
    setup: module.setupCustomBehavior({
      openImgModal,
      openSourceCodeModal,
      setImage: setSelection,
    }),
    toolbar: pluginConfig(isLibrary).toolbar,
    valid_children: '+body[style]',
    valid_elements: '*[*]',
  },
});

export const imgModalToggle = () => {
  const [isImgOpen, setIsOpen] = module.state.isImageModalOpen(false);
  return {
    isImgOpen,
    openImgModal: () => setIsOpen(true),
    closeImgModal: () => setIsOpen(false),
  };
};

export const sourceCodeModalToggle = (editorRef) => {
  const [isSourceCodeOpen, setIsOpen] = module.state.isSourceCodeModalOpen(false);
  return {
    isSourceCodeOpen,
    openSourceCodeModal: () => setIsOpen(true),
    closeSourceCodeModal: () => {
      setIsOpen(false);
      editorRef.current.focus();
    },
  };
};

export const openModalWithSelectedImage = ({ editor, setImage, openImgModal }) => () => {
  const imgHTML = editor.selection.getNode();
  setImage({
    externalUrl: imgHTML.src,
    altText: imgHTML.alt,
    width: imgHTML.width,
    height: imgHTML.height,
  });
  openImgModal();
};

export const prepareEditorRef = () => {
  const editorRef = useRef(null);
  const setEditorRef = useCallback((ref) => {
    editorRef.current = ref;
  }, []);
  const [refReady, setRefReady] = module.state.refReady(false);
  useEffect(() => setRefReady(true), []);
  return { editorRef, refReady, setEditorRef };
};

export const setAssetToStaticUrl = ({ editorvalue, images }) => {
  /* For assets to remain usable across course instances, we convert their url to be course-agnostic.
   * For example, /assets/course/<asset hash>/filename gets converted to /static/filename. This is
   * important for rerunning courses and importing/exporting course as the /static/ part of the url
   * allows the asset to be mapped to the new course run.
  */
  let content = editorvalue;
  const imageUrls = [];
  const imgsArray = Object.values(images);
  imgsArray.forEach(image => {
    imageUrls.push({ portableUrl: image.portableUrl, displayName: image.displayName });
  });
  const imageSrcs = typeof content === 'string' ? content.split('src="') : [];
  imageSrcs.forEach(src => {
    if (src.startsWith('/asset') && imageUrls.length > 0) {
      const nameFromEditorSrc = src.substring(src.lastIndexOf('@') + 1, src.indexOf('"'));
      const nameFromStudioSrc = nameFromEditorSrc.substring(nameFromEditorSrc.indexOf('/') + 1);
      let portableUrl;
      imageUrls.forEach((url) => {
        if (url.displayName === nameFromEditorSrc || url.displayName === nameFromStudioSrc) {
          portableUrl = url.portableUrl;
        }
      });
      if (portableUrl) {
        const currentSrc = src.substring(0, src.indexOf('"'));
        const updatedContent = content.replace(currentSrc, portableUrl);
        content = updatedContent;
      }
    }
  });
  return content;
};

export const getContent = ({ editorRef, isRaw, images }) => () => {
  const content = (isRaw && editorRef && editorRef.current
    ? editorRef.current.state.doc.toString()
    : editorRef.current?.getContent());
  return setAssetToStaticUrl({ editorvalue: content, images });
};

export const fetchImageUrls = (images) => {
  const imageUrls = [];
  const imgsArray = Object.values(images);
  imgsArray.forEach(image => {
    imageUrls.push({ staticFullUrl: image.staticFullUrl, displayName: image.displayName });
  });
  return imageUrls;
};

export const selectedImage = (val) => {
  const [selection, setSelection] = module.state.imageSelection(val);
  return {
    clearSelection: () => setSelection(null),
    selection,
    setSelection,
  };
};
