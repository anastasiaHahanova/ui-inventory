import React from 'react';
import PropTypes from 'prop-types';
import Paneset from '@folio/stripes-components/lib/Paneset';
import Pane from '@folio/stripes-components/lib/Pane';
import PaneMenu from '@folio/stripes-components/lib/PaneMenu';
import { Row, Col } from 'react-flexbox-grid';
import Button from '@folio/stripes-components/lib/Button';
import TextField from '@folio/stripes-components/lib/TextField';
import { Field, FieldArray } from 'redux-form';
import stripesForm from '@folio/stripes-form';
import Select from '@folio/stripes-components/lib/Select';

import renderAlternativeTitles from './alternativeTitles';
import renderSeries from './seriesFields';
import renderContributors from './contributorFields';
import renderSubjects from './subjectFields';
import renderIdentifiers from './identifierFields';
import renderClassifications from './classificationFields';
import renderPublication from './publicationFields';
import renderURLs from './urlFields';
import renderDescriptions from './descriptionFields';
import renderLanguages from './languageFields';
import renderNotes from './noteFields';

function validate(values) {
  const errors = {};

  const requiredMessage = 'Please fill this in to continue';

  if (!values.title) {
    errors.title = requiredMessage;
  }

  if (!values.instanceTypeId) {
    errors.instanceTypeId = 'Please select to continue';
  }

  // at least one creator is required
  if (!values.creators || !values.creators.length) {
    errors.creators = { _error: 'At least one creator must be entered' };
  } else {
    const creatorErrorList = [];
    values.creators.forEach((creator, i) => {
      const creatorErrors = {};
      if (!creator || !creator.name) {
        creatorErrors.name = requiredMessage;
        creatorErrorList[i] = creatorErrors;
      }
      if (!creator || !creator.creatorTypeId) {
        creatorErrors.creatorTypeId = 'Please select to continue';
        creatorErrorList[i] = creatorErrors;
      }
    });
    if (creatorErrorList.length) {
      errors.creators = creatorErrorList;
    }
  }

  // identifiers are not required, but if present must include value and type
  if (values.identifiers && values.identifiers.length) {
    const identifierErrorList = [];
    values.identifiers.forEach((identifier, i) => {
      const identifierErrors = {};
      if (!identifier || !identifier.value) {
        identifierErrors.value = requiredMessage;
        identifierErrorList[i] = identifierErrors;
      }
      if (!identifier || !identifier.identifierTypeId) {
        identifierErrors.identifierTypeId = 'Please select to continue';
        identifierErrorList[i] = identifierErrors;
      }
    });
    if (identifierErrorList.length) {
      errors.identifiers = identifierErrorList;
    }
  }

  return errors;
}

function asyncValidate(/* values, dispatch, props, blurredField */) {
  return new Promise(resolve => resolve());
}

function InstanceForm(props) {
  const {
    handleSubmit,
    pristine,
    submitting,
    onCancel,
    initialValues,
    identifierTypes,
    contributorTypes,
    classificationTypes,
    instanceTypes,
    instanceFormats,
  } = props;

  const instanceTypeOptions = instanceTypes ? instanceTypes.map(
                                it => ({
                                  label: it.name,
                                  value: it.id,
                                  selected: it.id === initialValues.instanceTypeId,
                                })) : [];

  const instanceFormatOptions = instanceFormats ? instanceFormats.map(
                                it => ({
                                  label: it.name,
                                  value: it.id,
                                  selected: it.id === initialValues.instanceFormatId,
                                })) : [];

  /* Menus for Add Instance workflow */
  const addInstanceFirstMenu = <PaneMenu><button onClick={onCancel} title="close" aria-label="Close New Instance Dialog"><span style={{ fontSize: '30px', color: '#999', lineHeight: '18px' }} >&times;</span></button></PaneMenu>;
  const addInstanceLastMenu = <PaneMenu><Button id="clickable-create-instance" type="submit" title="Create New Instance" disabled={pristine || submitting} onClick={handleSubmit}>Create instance</Button></PaneMenu>;
  const editInstanceLastMenu = <PaneMenu><Button id="clickable-update-instance" type="submit" title="Update Instance" disabled={pristine || submitting} onClick={handleSubmit}>Update instance</Button></PaneMenu>;
  return (
    <form>
      <Paneset isRoot>
        <Pane defaultWidth="100%" firstMenu={addInstanceFirstMenu} lastMenu={initialValues.title ? editInstanceLastMenu : addInstanceLastMenu} paneTitle={initialValues.title ? 'Edit Instance' : 'New Instance'}>
          <Row>
            <Col sm={5} smOffset={1}>
              <h2>Instance Record</h2>
              <Field label="Title *" name="title" id="input_instance_title" component={TextField} fullWidth />
            </Col>
          </Row>
          <Field type="hidden" name="source" component="input" />
          <FieldArray name="alternativeTitles" component={renderAlternativeTitles} />
          <Row>
            <Col sm={5} smOffset={1}>
              <Field label="Edition" name="edition" id="input_instance_edition" component={TextField} fullWidth />
            </Col>
          </Row>
          <FieldArray name="series" component={renderSeries} />

          <FieldArray name="identifiers" component={renderIdentifiers} identifierTypes={identifierTypes} />
          <FieldArray name="contributors" component={renderContributors} contributorTypes={contributorTypes} />
          <FieldArray name="subjects" component={renderSubjects} />
          <FieldArray name="classifications" component={renderClassifications} classificationTypes={classificationTypes} />
          <FieldArray name="publication" component={renderPublication} />
          <FieldArray name="urls" component={renderURLs} />
          <Row>
            <Col sm={5} smOffset={1}>
              <Field
                name="instanceTypeId"
                id="select_instance_type"
                type="text"
                component={Select}
                label="Resource type *"
                dataOptions={[{ label: 'Select resource type', value: '' }, ...instanceTypeOptions]}
              />
            </Col>
          </Row>

          <Row>
            <Col sm={5} smOffset={1}>
              <Field
                name="instanceFormatId"
                type="text"
                component={Select}
                label="Format"
                dataOptions={[{ label: 'Select format', value: '' }, ...instanceFormatOptions]}
              />
            </Col>
          </Row>
          <FieldArray name="physicalDescriptions" component={renderDescriptions} />
          <FieldArray name="languages" component={renderLanguages} />
          <FieldArray name="notes" component={renderNotes} />
        </Pane>
      </Paneset>
    </form>
  );
}
InstanceForm.propTypes = {
  onClose: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  newinstance: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  onCancel: PropTypes.func,
  initialValues: PropTypes.object,
  contributorTypes: PropTypes.arrayOf(PropTypes.object),
  identifierTypes: PropTypes.arrayOf(PropTypes.object),
  classificationTypes: PropTypes.arrayOf(PropTypes.object),
  instanceTypes: PropTypes.arrayOf(PropTypes.object),
  instanceFormats: PropTypes.arrayOf(PropTypes.object),
};

export default stripesForm({
  form: 'instanceForm',
  validate,
  asyncValidate,
  navigationCheck: true,
})(InstanceForm);