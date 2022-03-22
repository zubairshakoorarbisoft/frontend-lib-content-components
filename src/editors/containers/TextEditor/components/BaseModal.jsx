import React from 'react';
import PropTypes from 'prop-types';

import {
  ActionRow,
  Button,
  ModalDialog,
} from '@edx/paragon';
import { Add } from '@edx/paragon/icons';

export const BaseModal = ({
  isOpen,
  close,
  title,
  children,
  confirmAction,
  footerAction,
}) => (
  <ModalDialog
    title="My dialog"
    isOpen={isOpen}
    onClose={close}
    size="lg"
    variant="default"
    hasCloseButton
    isFullscreenOnMobile
    isFullscreenScroll
  >
    <ModalDialog.Header>
      <ModalDialog.Title>
        {title}
      </ModalDialog.Title>
    </ModalDialog.Header>
    <ModalDialog.Body>
      {children}
    </ModalDialog.Body>
    <ModalDialog.Footer>
      <ActionRow>
        {footerAction}
        <ActionRow.Spacer />
        <ModalDialog.CloseButton variant="tertiary" onClick={close}>
          Cancel
        </ModalDialog.CloseButton>
        {confirmAction}
      </ActionRow>
    </ModalDialog.Footer>
  </ModalDialog>
);

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  confirmAction: PropTypes.node.isRequired,
  footerAction: PropTypes.node.isRequired,
};

export default BaseModal;
