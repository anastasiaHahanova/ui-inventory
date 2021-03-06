import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Select } from '@folio/stripes/components';
import RepeatableField from '../components/RepeatableField';

const ParentInstanceFields = ({ instanceRelationshipTypes }) => {
  const relationshipOptions = instanceRelationshipTypes.map(
    it => ({
      label: it.name,
      value: it.id,
    }),
  );

  return (
    <RepeatableField
      name="parentInstances"
      label="Parent instances"
      addLabel="+ Add parent instance"
      addButtonId="clickable-add-parentinstance"
      template={[
        {
          label: 'Parent instance *',
          name: 'superInstanceId',
          component: TextField,
        },
        {
          label: 'Type of relation *',
          name: 'instanceRelationshipTypeId',
          component: Select,
          dataOptions: [{ label: 'Select type', value: '' }, ...relationshipOptions],
          required: true,
        },
      ]}
      newItemTemplate={{ superInstanceId: '', instanceRelationshipTypeId: '' }}
    />
  );
};

ParentInstanceFields.propTypes = {
  instanceRelationshipTypes: PropTypes.arrayOf(PropTypes.object)
};

export default ParentInstanceFields;
