import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { stripesShape } from '@folio/stripes-core/src/Stripes'; // eslint-disable-line import/no-unresolved

import SearchAndSort from '@folio/stripes-smart-components/lib/SearchAndSort';
import { filters2cql, onChangeFilter as commonChangeFilter } from '@folio/stripes-components/lib/FilterGroups';

import packageInfo from './package';
import InstanceForm from './edit/InstanceForm';
import ViewInstance from './ViewInstance';
import formatters from './referenceFormatters';

const INITIAL_RESULT_COUNT = 30;
const RESULT_COUNT_INCREMENT = 30;
const emptyObj = {};
const emptyArr = [];


const languages = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fre', name: 'French' },
  { code: 'ger', name: 'German' },
  { code: 'chi', name: 'Mandarin' },
  { code: 'rus', name: 'Russian' },
  { code: 'ara', name: 'Arabic' },
];

// the empty 'values' properties will be filled in by componentWillUpdate
// as those are pulled from the backend
const filterConfig = [
  {
    label: 'Resource Type',
    name: 'resource',
    cql: 'instanceTypeId',
    values: [],
  },
  {
    label: 'Language',
    name: 'language',
    cql: 'languages',
    values: languages.map(rec => ({ name: rec.name, cql: rec.code })),
  },
  {
    label: 'Location',
    name: 'location',
    cql: 'effectiveLocation',
    values: [],
  },
];

const searchableIndexes = [
  { label: 'All (title, contributor, identifier)', value: 'all', makeQuery: term => `(title="${term}*" or contributors adj "\\"name\\": \\"${term}*\\"" or identifiers adj "\\"value\\": \\"${term}*\\"")` },
  { label: 'Instance ID', value: 'id', makeQuery: term => `(id="${term}*")` },
  { label: 'Title', value: 'title', makeQuery: term => `(title="${term}*")` },
  { label: 'Identifier', value: 'identifier', makeQuery: term => `(identifiers adj "\\"value\\": \\"${term}*\\"")` },
  { label: '- ISBN', value: 'isbn', makeQuery: (term, args) => `identifiers == "*\\"value\\": \\"${term}*\\", \\"identifierTypeId\\": \\"${args.identifierTypeId}\\"*"` },
  { label: '- ISSN', value: 'issn', makeQuery: (term, args) => `identifiers == "*\\"value\\": \\"${term}*\\", \\"identifierTypeId\\": \\"${args.identifierTypeId}\\"*"` },
  { label: 'Contributor', value: 'contributor', makeQuery: term => `(contributors adj "\\"name\\": \\"${term}*\\"")` },
  { label: 'Subject', value: 'subject', makeQuery: term => `(subjects="${term}*")` },
];

class Instances extends React.Component {
  static manifest = Object.freeze({
    numFiltersLoaded: { initialValue: 1 }, // will be incremented as each filter loads
    query: {
      initialValue: {
        query: '',
        filters: '',
        sort: 'title',
      },
    },
    resultCount: { initialValue: INITIAL_RESULT_COUNT },
    records: {
      type: 'okapi',
      records: 'instances',
      recordsRequired: '%{resultCount}',
      perRequest: 30,
      path: 'instance-storage/instances',
      GET: {
        params: {
          query: (...args) => {
            /*
              This code is not DRY as it is copied from makeQueryFunction in stripes-components.
              This is necessary, as makeQueryFunction only references query parameters as a data source.
              STRIPES-480 is intended to correct this and allow this query function to be replace with a call
              to makeQueryFunction.
              https://issues.folio.org/browse/STRIPES-480
            */
            const resourceData = args[2];
            const sortMap = {
              Title: 'title',
              publishers: 'publication',
              Contributors: 'contributors',
            };

            const index = resourceData.query.qindex ? resourceData.query.qindex : 'all';
            const searchableIndex = searchableIndexes.find(idx => idx.value === index);

            let makeQueryArgs = {};
            if (index === 'isbn' || index === 'issn') {
              const identifierType = resourceData.identifier_types.records.find(type => type.name.toLowerCase() === index);
              makeQueryArgs = { identifierTypeId: (identifierType ? identifierType.id : 'identifier-type-not-found') };
            }

            let cql = searchableIndex.makeQuery(resourceData.query.query, makeQueryArgs);

            let filterCql = filters2cql(filterConfig, resourceData.query.filters);

            if (filterCql) {
              // Pattern: effectiveLocation="abc" or effectiveLocation=("abc", "xyz")
              const locationQueryMatch = /effectiveLocation=(\("[^=]*"\)|"[^=]*")/.exec(filterCql);
              if (locationQueryMatch) {
                // Build 'effective location' query
                const criteria = locationQueryMatch[0];
                const criteriaValue = criteria.split('=')[1];
                filterCql = filterCql.replace(criteria,
                  '( (cql.allRecords=1 ' +
                    ' not holdingsRecords.temporaryLocationId="" not item.permanentLocationId="" not item.temporaryLocationId=""' +
                    ` and holdingsRecords.permanentLocationId=${criteriaValue})` +
                    ' or ' +
                    '(cql.allRecords=1 ' +
                    ' not item.permanentLocationId="" not item.temporaryLocationId=""' +
                    ` and holdingsRecords.temporaryLocationId=${criteriaValue})` +
                    ' or ' +
                    '(cql.allRecords=1 ' +
                    ' not item.temporaryLocationId=""' +
                    ` and item.permanentLocationId=${criteriaValue})` +
                    ' or ' +
                    `(item.temporaryLocationId=${criteriaValue})` +
                   ')');
              }
              if (cql) {
                cql = `(${cql}) and ${filterCql}`;
              } else {
                cql = filterCql;
              }
            }

            const { sort } = resourceData.query;
            if (sort) {
              const sortIndexes = sort.split(',').map((sort1) => {
                let reverse = false;
                if (sort1.startsWith('-')) {
                  // eslint-disable-next-line no-param-reassign
                  sort1 = sort1.substr(1);
                  reverse = true;
                }
                let sortIndex = sortMap[sort1] || sort1;
                if (reverse) {
                  sortIndex = `${sortIndex.replace(' ', '/sort.descending ')}/sort.descending`;
                }
                return sortIndex;
              });

              cql += ` sortby ${sortIndexes.join(' ')}`;
            }

            return cql;
          },
        },
        staticFallback: { params: {} },
      },
    },
    identifierTypes: {
      type: 'okapi',
      records: 'identifierTypes',
      path: 'identifier-types?limit=100&query=cql.allRecords=1 sortby name',
    },
    contributorTypes: {
      type: 'okapi',
      records: 'contributorTypes',
      path: 'contributor-types?limit=100&query=cql.allRecords=1 sortby name',
    },
    contributorNameTypes: {
      type: 'okapi',
      records: 'contributorNameTypes',
      path: 'contributor-name-types?limit=100&query=cql.allRecords=1 sortby ordering',
    },
    instanceFormats: {
      type: 'okapi',
      records: 'instanceFormats',
      path: 'instance-formats?limit=100&query=cql.allRecords=1 sortby name',
    },
    instanceTypes: {
      type: 'okapi',
      records: 'instanceTypes',
      path: 'instance-types?limit=100&query=cql.allRecords=1 sortby name',
    },
    classificationTypes: {
      type: 'okapi',
      records: 'classificationTypes',
      path: 'classification-types?limit=100&query=cql.allRecords=1 sortby name',
    },
    locations: {
      type: 'okapi',
      records: 'locations',
      path: 'locations?limit=100&query=cql.allRecords=1 sortby name',
    },
  });

  constructor(props) {
    super(props);

    this.cViewInstance = this.props.stripes.connect(ViewInstance);
    this.resultsList = null;
    this.SRStatus = null;

    this.onChangeFilter = commonChangeFilter.bind(this);
    this.copyInstance = this.copyInstance.bind(this);

    this.state = {};
  }

  /**
   * fill in the filter values
   */
  static getDerivedStateFromProps(props) {
    // resource types
    const rt = (props.resources.instanceTypes || {}).records || [];
    if (rt && rt.length) {
      const oldValuesLength = filterConfig[0].values.length;
      filterConfig[0].values = rt.map(rec => ({ name: rec.name, cql: rec.id }));
      if (oldValuesLength === 0) {
        const numFiltersLoaded = props.resources.numFiltersLoaded;
        props.mutator.numFiltersLoaded.replace(numFiltersLoaded + 1); // triggers refresh of records
      }
    }

    // locations
    const locations = (props.resources.locations || {}).records || [];
    if (locations && locations.length) {
      const oldValuesLength = filterConfig[2].values.length;
      filterConfig[2].values = locations.map(rec => ({ name: rec.name, cql: rec.id }));
      if (oldValuesLength === 0) {
        const numFiltersLoaded = props.resources.numFiltersLoaded;
        props.mutator.numFiltersLoaded.replace(numFiltersLoaded + 1); // triggers refresh of records
      }
    }

    return null;
  }

  onChangeIndex = (e) => {
    const qindex = e.target.value;
    this.props.mutator.query.update({ qindex });
  }

  updateFilters(filters) { // provided for onChangeFilter
    this.props.mutator.query.update({ filters: Object.keys(filters).filter(key => filters[key]).join(',') });
  }

  closeNewInstance = (e) => {
    if (e) e.preventDefault();
    this.setState({ copiedInstance: null });
    this.props.mutator.query.update({ layer: null });
  }

  copyInstance(instance) {
    this.setState({ copiedInstance: _.omit(instance, ['id']) });
    this.props.mutator.query.update({ layer: 'create' });
  }

  createInstance = (instance) => {
    // POST item record
    this.props.mutator.records.POST(instance).then(() => {
      this.closeNewInstance();
    });
  }

  render() {
    const { resources } = this.props;

    if (!resources.contributorTypes || !resources.contributorTypes.hasLoaded
        || !resources.contributorNameTypes || !resources.contributorNameTypes.hasLoaded
        || !resources.identifierTypes || !resources.identifierTypes.hasLoaded
        || !resources.classificationTypes || !resources.classificationTypes.hasLoaded
        || !resources.instanceTypes || !resources.instanceTypes.hasLoaded
        || !resources.instanceFormats || !resources.instanceFormats.hasLoaded
        || !resources.locations || !resources.locations.hasLoaded) return <div />;

    const contributorTypes = (resources.contributorTypes || emptyObj).records || emptyArr;
    const contributorNameTypes = (resources.contributorNameTypes || emptyObj).records || emptyArr;
    const identifierTypes = (resources.identifierTypes || emptyObj).records || emptyArr;
    const classificationTypes = (resources.classificationTypes || emptyObj).records || emptyArr;
    const instanceTypes = (resources.instanceTypes || emptyObj).records || emptyArr;
    const instanceFormats = (resources.instanceFormats || emptyObj).records || emptyArr;
    const locations = (resources.locations || emptyObj).records || emptyArr;
    const locationsById = _.keyBy(locations, 'id');

    const referenceTables = {
      contributorTypes,
      contributorNameTypes,
      identifierTypes,
      classificationTypes,
      instanceTypes,
      instanceFormats,
      locationsById,
    };

    const resultsFormatter = {
      'publishers': r => r.publication.map(p => `${p.publisher} ${p.dateOfPublication ? `(${p.dateOfPublication})` : ''}`).join(', '),
      'publication date': r => r.publication.map(p => p.dateOfPublication).join(', '),
      'contributors': r => formatters.contributorsFormatter(r, contributorTypes),
    };

    return (<SearchAndSort
      packageInfo={packageInfo}
      objectName="inventory"
      maxSortKeys={1}
      searchableIndexes={searchableIndexes}
      selectedIndex={_.get(this.props.resources.query, 'qindex')}
      searchableIndexesPlaceholder={null}
      onChangeIndex={this.onChangeIndex}
      filterConfig={filterConfig}
      initialResultCount={INITIAL_RESULT_COUNT}
      resultCountIncrement={RESULT_COUNT_INCREMENT}
      viewRecordComponent={ViewInstance}
      editRecordComponent={InstanceForm}
      newRecordInitialValues={(this.state && this.state.copiedInstance) ? this.state.copiedInstance : { source: 'manual' }}
      visibleColumns={['title', 'contributors', 'publishers']}
      columnWidths={{ title: '40%' }}
      resultsFormatter={resultsFormatter}
      onCreate={this.createInstance}
      viewRecordPerms="inventory-storage.instances.item.get"
      newRecordPerms="inventory-storage.instances.item.post"
      disableRecordCreation={false}
      parentResources={this.props.resources}
      parentMutator={this.props.mutator}
      detailProps={{ referenceTables, onCopy: this.copyInstance }}
      path={`${this.props.match.path}/view/:id/:holdingsrecordid?/:itemid?`}
      showSingleResult
    />);
  }
}

Instances.propTypes = {
  stripes: stripesShape.isRequired,
  resources: PropTypes.shape({
    records: PropTypes.shape({
      hasLoaded: PropTypes.bool.isRequired,
      other: PropTypes.shape({
        totalRecords: PropTypes.number,
        total_records: PropTypes.number,
      }),
      successfulMutations: PropTypes.arrayOf(
        PropTypes.shape({
          record: PropTypes.shape({
            id: PropTypes.string.isRequired,
          }).isRequired,
        }),
      ),
    }),
    numFiltersLoaded: PropTypes.number,
    resultCount: PropTypes.number,
    instanceTypes: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
    locations: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
    query: PropTypes.shape({
      qindex: PropTypes.string,
      term: PropTypes.string,
    }),
  }).isRequired,
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
  }).isRequired,
  mutator: PropTypes.shape({
    addInstanceMode: PropTypes.shape({
      replace: PropTypes.func,
    }),
    numFiltersLoaded: PropTypes.shape({
      replace: PropTypes.func.isRequired,
    }),
    records: PropTypes.shape({
      POST: PropTypes.func,
    }),
    resultCount: PropTypes.shape({
      replace: PropTypes.func,
    }),
    query: PropTypes.shape({
      update: PropTypes.func,
    }),
  }).isRequired,
};

export default Instances;
