import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@folio/stripes-components/lib/TextField';
import Select from '@folio/stripes-components/lib/Select';
import RepeatableField from '../src/components/RepeatableField';

const ParentInstanceFields = ({ instanceRelationshipTypes, formatMsg }) => {
  const relationshipOptions = instanceRelationshipTypes.map(
    it => ({
      label: it.name,
      value: it.id,
    }),
  );

  return (
    <RepeatableField
      name="parentInstances"
      label={formatMsg({ id: 'ui-inventory.parentInstances' })}
      addLabel={formatMsg({ id: 'ui-inventory.addParentInstance' })}
      addButtonId="clickable-add-parentinstance"
      template={[
        {
          label: `${formatMsg({ id: 'ui-inventory.parentInstance' })} *`,
          name: 'superInstanceId',
          component: TextField,
        },
        {
          label: `${formatMsg({ id: 'ui-inventory.typeOfRelation' })} *`,
          name: 'instanceRelationshipTypeId',
          component: Select,
          dataOptions: [{ label: formatMsg({ id: 'ui-inventory.selectTypeOfRelation' }), value: '' }, ...relationshipOptions],
          required: true,
        },
      ]}
      newItemTemplate={{ superInstanceId: '', instanceRelationshipTypeId: '' }}
    />
  );
};

ParentInstanceFields.propTypes = {
  instanceRelationshipTypes: PropTypes.arrayOf(PropTypes.object),
  formatMsg: PropTypes.func,
};
export default ParentInstanceFields;
