import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  FormattedMessage,
  injectIntl,
  intlShape,
} from '@edx/frontend-platform/i18n';
import {
  Button,
  Form,
  Stack,
} from '@edx/paragon';
import { Add } from '@edx/paragon/icons';

import { actions, selectors } from '../../../../../../data/redux';
import hooks from './hooks';
import messages from './messages';
import CollapsibleFormWidget from '../CollapsibleFormWidget';
import LicenseBlurb from './LicenseBlurb';
import LicenseSelector from './LicenseSelector';
import LicenseDetails from './LicenseDetails';
import LicenseDisplay from './LicenseDisplay';

/**
 * Collapsible Form widget controlling video license type and details
 */
export const LicenseWidget = ({
  // injected
  intl,
  // redux
  isLibrary,
  licenseType,
  licenseDetails,
  courseLicenseType,
  courseLicenseDetails,
  updateField,
}) => {
  const { license, details, level } = hooks.determineLicense({
    isLibrary,
    licenseType,
    licenseDetails,
    courseLicenseType,
    courseLicenseDetails,
  });
  const { licenseDescription, levelDescription } = hooks.determineText({ level });
  return (
    <CollapsibleFormWidget
      subtitle={(
        <div>
          <LicenseBlurb license={license} details={details} />
          <Form.Text>{levelDescription}</Form.Text>
        </div>
      )}
      title={intl.formatMessage(messages.title)}
    >
      <Stack gap={3}>

        {license ? (
          <>
            <LicenseSelector license={license} level={level} />
            <LicenseDetails license={license} details={details} level={level} />
            <LicenseDisplay
              license={license}
              details={details}
              licenseDescription={licenseDescription}
              level={level}
            />
          </>
        ) : null }
        {!licenseType ? (
          <>
            <div className="border-primary-100 border-bottom" />
            <Button
              iconBefore={Add}
              variant="link"
              onClick={() => updateField({ licenseType: 'select', licenseDetails: {} })}
            >
              <FormattedMessage {...messages.addLicenseButtonLabel} />
            </Button>
          </>
        ) : null }
      </Stack>
    </CollapsibleFormWidget>
  );
};

LicenseWidget.propTypes = {
  // injected
  intl: intlShape.isRequired,
  // redux
  isLibrary: PropTypes.bool.isRequired,
  licenseType: PropTypes.string.isRequired,
  licenseDetails: PropTypes.shape({}).isRequired,
  courseLicenseType: PropTypes.string.isRequired,
  courseLicenseDetails: PropTypes.shape({}).isRequired,
  updateField: PropTypes.func.isRequired,
};

export const mapStateToProps = (state) => ({
  isLibrary: selectors.app.isLibrary(state),
  licenseType: selectors.video.licenseType(state),
  licenseDetails: selectors.video.licenseDetails(state),
  courseLicenseType: selectors.video.courseLicenseType(state),
  courseLicenseDetails: selectors.video.courseLicenseDetails(state),
});

export const mapDispatchToProps = (dispatch) => ({
  updateField: (stateUpdate) => dispatch(actions.video.updateField(stateUpdate)),
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(LicenseWidget));
