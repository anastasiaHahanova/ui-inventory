import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@folio/stripes/components';
import RepeatableField from '../components/RepeatableField';

const DescriptionFields = ({ formatMsg }) => (
  <RepeatableField
    name="physicalDescriptions"
    label={formatMsg({ id: 'ui-inventory.physicalDescriptions' })}
    addLabel={formatMsg({ id: 'ui-inventory.addDescription' })}
    addButtonId="clickable-add-description"
    template={[{
      label: formatMsg({ id: 'ui-inventory.physicalDescription' }),
      component: TextField,
    }]}
  />
);

DescriptionFields.propTypes = { formatMsg: PropTypes.func };
export default DescriptionFields;
