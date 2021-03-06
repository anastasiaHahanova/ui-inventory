import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@folio/stripes/components';
import RepeatableField from '../components/RepeatableField';

const AlternativeTitles = ({ formatMsg }) => (
  <RepeatableField
    name="alternativeTitles"
    label={formatMsg({ id: 'ui-inventory.alternativeTitles' })}
    addLabel={formatMsg({ id: 'ui-inventory.addAlternativeTitles' })}
    addButtonId="clickable-add-alternativeTitle"
    template={[{
      label: 'Alternative title',
      component: TextField,
    }]}
  />
);

AlternativeTitles.propTypes = { formatMsg: PropTypes.func };
export default AlternativeTitles;
