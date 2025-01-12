import React from 'react';
import { shallow } from 'enzyme';
import hooks from './hooks';
import { formatMessage } from '../../../../../testUtils';

import { SourceCodeModal } from '.';

jest.mock('./hooks', () => ({
  prepareSourceCodeModal: jest.fn(() => {

  }),
}));

describe('SourceCodeModal', () => {
  const mockClose = jest.fn();

  const props = {
    isOpen: false,
    close: mockClose,
    editorRef: {
      current: jest.fn(),
    },
    intl: { formatMessage },
  };
  test('renders as expected with default behavior', () => {
    const mocksaveBtnProps = 'SoMevAlue';
    const mockvalue = 'mOckHtMl';
    const mockref = 'moCKrEf';
    hooks.prepareSourceCodeModal.mockReturnValueOnce({
      saveBtnProps: mocksaveBtnProps,
      value: mockvalue,
      ref: mockref,
    });
    expect(shallow(<SourceCodeModal {...props} />)).toMatchSnapshot();
  });
});
