import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@folio/stripes-components/lib/TextField';
import Select from '@folio/stripes-components/lib/Select';
import RepeatableField from '../src/components/RepeatableField';

const ChildInstanceFields = ({ instanceRelationshipTypes, formatMsg }) => {
  const relationshipOptions = instanceRelationshipTypes.map(
    it => ({
      label: it.name,
      value: it.id,
    }),
  );

  return (
    <RepeatableField
      name="childInstances"
      label={formatMsg({ id: 'ui-inventory.childInstances' })}
      addLabel={formatMsg({ id: 'ui-inventory.addChildInstance' })}
      addButtonId="clickable-add-childinstance"
      template={[
        {
          label: `${formatMsg({ id: 'ui-inventory.childInstance' })} *`,
          name: 'subInstanceId',
          component: TextField,
          required: true,
        },
        {
          label: `${formatMsg({ id: 'ui-inventory.typeOfRelation' })} *`,
          name: 'instanceRelationshipTypeId',
          component: Select,
          dataOptions: [{ label: formatMsg({ id: 'ui-inventory.selectTypeOfRelation' }), value: '' }, ...relationshipOptions],
          required: true,
        },
      ]}
      newItemTemplate={{ subInstanceId: '', relationshipTypeId: '' }}
    />
  );
};

ChildInstanceFields.propTypes = {
  instanceRelationshipTypes: PropTypes.arrayOf(PropTypes.object),
  formatMsg: PropTypes.func,
};

export default ChildInstanceFields;
