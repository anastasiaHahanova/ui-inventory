import _ from 'lodash';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { TitleManager } from '@folio/stripes/core';
import {
  Pane,
  PaneMenu,
  Row,
  Col,
  Button,
  Accordion,
  ExpandAllButton,
  KeyValue,
  Layer,
  Layout,
  IconButton,
  AppIcon,
  Icon,
  Headline,
  MultiColumnList,
} from '@folio/stripes/components';
import { ViewMetaData } from '@folio/stripes/smart-components';
import { craftLayerUrl } from './utils';

import formatters from './referenceFormatters';

import Holdings from './Holdings';
import InstanceForm from './edit/InstanceForm';
import HoldingsForm from './edit/holdings/HoldingsForm';
import ViewHoldingsRecord from './ViewHoldingsRecord';
import ViewItem from './ViewItem';
import ViewMarc from './ViewMarc';
import makeConnectedInstance from './ConnectedInstance';

const emptyObj = {};

class ViewInstance extends React.Component {
  static manifest = Object.freeze({
    query: {},
    selectedInstance: {
      type: 'okapi',
      path: 'inventory/instances/:{id}',
      clear: false,
    },
    holdings: {
      type: 'okapi',
      records: 'holdingsRecords',
      path: 'holdings-storage/holdings',
      fetch: false,
    },
  });

  constructor(props) {
    super(props);

    const logger = props.stripes.logger;
    this.log = logger.log.bind(logger);

    this.state = {
      accordions: {
        instanceAccordion: true,
        titleAccordion: true,
        descriptiveAccordion: true,
        notesAccordion: true,
        identifiersAccordion: true,
        classificationAccordion: true,
        electronicAccessAccordion: true,
        contributorsAccordion: true,
        subjectsAccordion: true,
        analyticsAccordion: true,
      },
    };
    this.cHoldings = this.props.stripes.connect(Holdings);
    this.cViewHoldingsRecord = this.props.stripes.connect(ViewHoldingsRecord);
    this.cViewItem = this.props.stripes.connect(ViewItem);
    this.cViewMetaData = this.props.stripes.connect(ViewMetaData);
    this.cViewMarc = this.props.stripes.connect(ViewMarc);

    this.craftLayerUrl = craftLayerUrl.bind(this);
  }

  // Edit Instance Handlers
  onClickEditInstance = (e) => {
    if (e) e.preventDefault();
    this.props.mutator.query.update({ layer: 'edit' });
  }

  onClickAddNewHoldingsRecord = (e) => {
    if (e) e.preventDefault();
    this.log('clicked "add new holdings record"');
    this.props.mutator.query.update({ layer: 'createHoldingsRecord' });
  }

  onClickCloseNewHoldingsRecord = (e) => {
    if (e) e.preventDefault();
    this.log('clicked "close new holdings record"');
    this.props.mutator.query.update({ layer: null });
  }

  update(instance) {
    this.props.mutator.selectedInstance.PUT(instance).then(() => {
      this.closeEditInstance();
    });
  }

  closeEditInstance = (e) => {
    if (e) e.preventDefault();
    this.props.mutator.query.update({ layer: null });
  }

  closeViewItem = (e) => {
    if (e) e.preventDefault();
    this.props.mutator.query.update({ _path: `/inventory/view/${this.props.match.params.id}` });
  }

  closeViewMarc = (e) => {
    if (e) e.preventDefault();
    this.props.mutator.query.update({ _path: `/inventory/view/${this.props.match.params.id}` });
  }

  closeViewHoldingsRecord = (e) => {
    if (e) e.preventDefault();
    this.props.mutator.query.update({ _path: `/inventory/view/${this.props.match.params.id}` });
  }

  createHoldingsRecord = (holdingsRecord) => {
    // POST holdings record
    this.log(`Creating new holdings record: ${JSON.stringify(holdingsRecord)}`);
    this.props.mutator.holdings.POST(holdingsRecord).then(() => {
      this.onClickCloseNewHoldingsRecord();
    });
  }

  handleAccordionToggle = ({ id }) => {
    this.setState((state) => {
      const newState = _.cloneDeep(state);
      if (!_.has(newState.accordions, id)) newState.accordions[id] = true;
      newState.accordions[id] = !newState.accordions[id];
      return newState;
    });
  }

  handleExpandAll = (obj) => {
    this.setState((curState) => {
      const newState = _.cloneDeep(curState);
      newState.accordions = obj;
      return newState;
    });
  }

  refLookup = (referenceTable, id) => {
    const ref = (referenceTable && id) ? referenceTable.find(record => record.id === id) : {};
    return ref || {};
  }

  render() {
    const { okapi, match: { params: { id, holdingsrecordid, itemid } }, location, referenceTables, stripes, onCopy } = this.props;
    const query = location.search ? queryString.parse(location.search) : emptyObj;
    const formatMsg = this.props.stripes.intl.formatMessage;
    const ci = makeConnectedInstance(this.props, this.props.stripes.logger);
    const instance = ci.instance();

    const identifiersRowFormatter = {
      'Resource identifier type': x => this.refLookup(referenceTables.identifierTypes, _.get(x, ['identifierTypeId'])).name,
      'Resource identifier': x => _.get(x, ['value']) || '--',
    };

    const classificationsRowFormatter = {
      'Classification identifier type': x => this.refLookup(referenceTables.classificationTypes, _.get(x, ['classificationTypeId'])).name,
      'Classification': x => _.get(x, ['classificationNumber']) || '--',
    };

    const publicationRowFormatter = {
      'Publisher': x => _.get(x, ['publisher']) || '',
      'Publisher role': x => _.get(x, ['role']) || '',
      'Place of publication': x => _.get(x, ['place']) || '',
      'Publication date': x => _.get(x, ['dateOfPublication']) || '',
    };

    const contributorsRowFormatter = {
      'Name type': x => this.refLookup(referenceTables.contributorNameTypes, _.get(x, ['contributorNameTypeId'])).name,
      'Name': x => _.get(x, ['name']),
      'Type': x => this.refLookup(referenceTables.contributorTypes, _.get(x, ['contributorTypeId'])).name,
      'Code': x => this.refLookup(referenceTables.contributorTypes, _.get(x, ['contributorTypeId'])).code,
      'Source': x => this.refLookup(referenceTables.contributorTypes, _.get(x, ['contributorTypeId'])).source,
      'Free text': x => _.get(x, ['contributorTypeText']) || '',
    };

    const electronicAccessRowFormatter = {
      'URL relationship': x => this.refLookup(referenceTables.electronicAccessRelationships, _.get(x, ['relationshipId'])).name,
      'URI': x => <a href={_.get(x, ['uri'])}>{_.get(x, ['uri'])}</a>,
      'Link text': x => _.get(x, ['linkText']) || '',
      'Materials specified': x => _.get(x, ['materialsSpecification']) || '',
      'URL public note': x => _.get(x, ['publicNote']) || '',
    };

    const formatsRowFormatter = {
      'Category': x => {
        const term = this.refLookup(referenceTables.instanceFormats, x.id).name;
        if (term && term.split('--').length === 2) {
          return term.split('--')[0];
        } else {
          return '';
        }
      },
      'Term': x => {
        const term = this.refLookup(referenceTables.instanceFormats, x.id).name;
        if (term && term.split('--').length === 2) {
          return term.split('--')[1];
        } else {
          return term;
        }
      },
      'Code': x => this.refLookup(referenceTables.instanceFormats, x.id).code,
      'Source': x => this.refLookup(referenceTables.instanceFormats, x.id).source,
    };


    const detailMenu = (
      <PaneMenu>
        <IconButton
          id="clickable-edit-instance"
          style={{ visibility: !instance ? 'hidden' : 'visible' }}
          href={this.craftLayerUrl('edit', location)}
          onClick={this.onClickEditInstance}
          title={formatMsg({ id: 'ui-inventory.editInstance' })}
          icon="edit"
        />
      </PaneMenu>
    );

    if (!instance) {
      return (
        <Pane id="pane-instancedetails" defaultWidth={this.props.paneWidth} paneTitle={formatMsg({ id: 'ui-inventory.instanceDetails' })} lastMenu={detailMenu} dismissible onClose={this.props.onClose}>
          <div style={{ paddingTop: '1rem' }}><Icon icon="spinner-ellipsis" width="100px" /></div>
        </Pane>
      );
    }

    const instanceSub = () => {
      if (instance.publication && instance.publication.length > 0 && instance.publication[0]) {
        return `${instance.publication[0].publisher}${instance.publication[0].dateOfPublication ? `, ${instance.publication[0].dateOfPublication}` : ''}`;
      }
      return null;
    };

    const newHoldingsRecordButton = (
      <Button
        id="clickable-new-holdings-record"
        href={this.craftLayerUrl('createHoldingsRecord', location)}
        onClick={this.onClickAddNewHoldingsRecord}
        title={formatMsg({ id: 'ui-inventory.addHoldings' })}
        buttonStyle="primary"
        fullWidth
      >
        {formatMsg({ id: 'ui-inventory.addHoldings' })}
      </Button>
    );
    const viewSourceLink = `${location.pathname.replace('/view/', '/viewsource/')}${location.search}`;
    const viewSourceButton = (
      <Button
        to={viewSourceLink}
        id="clickable-view-source"
        marginBottom0
      >
        {formatMsg({ id: 'ui-inventory.viewSource' })}
      </Button>
    );

    return instance ? (
      <div data-test-instance-details>
        <Pane
          defaultWidth={this.props.paneWidth}
          paneTitle={instance.title}
          paneSub={instanceSub()}
          lastMenu={detailMenu}
          dismissible
          onClose={this.props.onClose}
          actionMenuItems={[{
            label: formatMsg({ id: 'ui-inventory.editInstance' }),
            href: this.craftLayerUrl('edit'),
            onClick: this.onClickEditInstance,
          }, {
            id: 'clickable-copy-instance',
            onClick: () => onCopy(instance),
            label: formatMsg({ id: 'ui-inventory.copyInstance' })
          }]}
        >
          <TitleManager record={instance.title} />
          <Row end="xs"><Col xs><ExpandAllButton accordionStatus={this.state.accordions} onToggle={this.handleExpandAll} /></Col></Row>
          <hr />
          <Row>
            <Col xs={12}>
              <Layout className="display-flex flex-align-items-center padding-bottom-gutter flex-wrap--wrap">
                <Layout className="margin-end-gutter display-flex flex-align-items-center">
                  <AppIcon
                    app="inventory"
                    iconKey="instance"
                    size="small"
                  >
                    { formatMsg({ id: 'ui-inventory.instanceRecord' }) }
                  </AppIcon>
                </Layout>
                <Layout className="margin-end-gutter display-flex flex-align-items-center">
                  <AppIcon
                    app="inventory"
                    iconKey="resource-type"
                    size="small"
                  >
                    {formatters.instanceTypesFormatter(instance, referenceTables.instanceTypes)}
                  </AppIcon>
                </Layout>
                { (!!instance.sourceRecordFormat) && (
                <Layout className="margin-start-auto">
                  {viewSourceButton}
                </Layout>
                ) }
              </Layout>
            </Col>
          </Row>
          <Headline size="medium" margin="medium">
            {instance.title}
          </Headline>
          <Accordion
            open={this.state.accordions.instanceAccordion}
            id="instanceAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.instanceData' })}
          >
            { (instance.metadata && instance.metadata.createdDate) &&
            <this.cViewMetaData metadata={instance.metadata} />
          }
            <Row>
              <Col xs={12}>
                {instance.discoverySuppress && formatMsg({ id: 'ui-inventory.discoverySuppress' })}
                {instance.discoverySuppress && instance.staffSuppress && '|'}
                {instance.staffSuppress && formatMsg({ id: 'ui-inventory.staffSuppress' })}
                {(instance.discoverySuppress || instance.staffSuppress) && instance.previouslyHeld && '|'}
                {instance.previouslyHeld && formatMsg({ id: 'ui-inventory.previouslyHeld' })}
              </Col>
            </Row>
            { (instance.discoverySuppress || instance.staffSuppress || instance.previouslyHeld) && <br /> }
            <Row>
              <Col xs={2}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.instanceHrid' })} value={_.get(instance, ['hrid'], '')} />
              </Col>
              <Col xs={2}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.metadataSource' })} value={(instance.sourceRecordFormat ? _.get(instance, ['source'], '') : 'FOLIO')} />
              </Col>
              <Col xs={4}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.catalogedDate' })} value={_.get(instance, ['catalogedDate'], '')} />
              </Col>
            </Row>
            <Row>
              <Col xs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.instanceStatusTerm' })}
                  value={this.refLookup(referenceTables.instanceStatuses, _.get(instance, ['statusId'])).name}
                />
              </Col>
              <Col xs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.instanceStatusCode' })}
                  value={this.refLookup(referenceTables.instanceStatuses, _.get(instance, ['statusId'])).code}
                />
              </Col>
              <Col cs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.instanceStatusSource' })}
                  value={this.refLookup(referenceTables.instanceStatuses, _.get(instance, ['statusId'])).source}
                />
              </Col>
              <Col xs={3}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.instanceStatusUpdatedDate' })} value={_.get(instance, ['statusUpdatedDate'], '')} />
              </Col>
            </Row>
            <Row>
              <Col xs={6}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.modeOfIssuance' })} value={formatters.modesOfIssuanceFormatter(instance, referenceTables.modesOfIssuance)} />
              </Col>
            </Row>
          </Accordion>
          <Accordion
            open={this.state.accordions.titleAccordion}
            id="titleAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.titleData' })}
          >
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.resourceTitle' })} value={_.get(instance, ['title'], '')} />
              </Col>
            </Row>
            { (instance.alternativeTitles.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.alternativeTitles' })} value={_.get(instance, ['alternativeTitles'], []).map((title, i) => <div key={i}>{title}</div>)} />
              </Col>
            </Row>
          }
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.indexTitle' })} value={_.get(instance, ['indexTitle'], '')} />
              </Col>
            </Row>
            <Row>
              { (instance.series.length > 0) &&
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.seriesStatement' })} value={_.get(instance, ['series'], '')} />
              </Col>
            }
            </Row>
          </Accordion>
          <Accordion
            open={this.state.accordions.identifiersAccordion}
            id="identifiersAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.identifiers' })}
          >
            { (instance.identifiers.length > 0) &&
            <MultiColumnList
              id="list-identifiers"
              contentData={instance.identifiers}
              rowMetadata={['identifierTypeId']}
              visibleColumns={['Resource identifier type', 'Resource identifier']}
              formatter={identifiersRowFormatter}
              ariaLabel="Identifiers"
              containerRef={(ref) => { this.resultsList = ref; }}
            />
        }
          </Accordion>
          <Accordion
            open={this.state.accordions.contributorsAccordion}
            id="contributorsAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.contributors' })}
          >
            { (instance.contributors.length > 0) &&
            <MultiColumnList
              id="list-contributors"
              contentData={instance.contributors}
              visibleColumns={['Name type', 'Name', 'Type', 'Code', 'Source', 'Free text']}
              formatter={contributorsRowFormatter}
              ariaLabel="Contributors"
              containerRef={(ref) => { this.resultsList = ref; }}
            />
          }
          </Accordion>
          <Accordion
            open={this.state.accordions.descriptiveAccordion}
            id="descriptiveAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.descriptiveData' })}
          >
            { (instance.publication.length > 0) &&
            <MultiColumnList
              id="list-publication"
              contentData={instance.publication}
              visibleColumns={['Publisher', 'Publisher role', 'Place of publication', 'Publication date']}
              formatter={publicationRowFormatter}
              ariaLabel="Publication"
              containerRef={(ref) => { this.resultsList = ref; }}
            />
          }
            <br />
            <Row>
              { (instance.editions && instance.editions.length > 0) &&
              <Col xs={6}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.edition' })} value={_.get(instance, ['editions'], []).map((edition, i) => <div key={i}>{edition}</div>)} />
              </Col>
            }
              { (instance.physicalDescriptions.length > 0) &&
              <Col xs={6}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.physicalDescription' })} value={_.get(instance, ['physicalDescriptions'], []).map((desc, i) => <div key={i}>{desc}</div>)} />
              </Col>
            }
            </Row>
            <Row>
              <Col xs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.resourceTypeTerm' })}
                  value={this.refLookup(referenceTables.instanceTypes, _.get(instance, ['instanceTypeId'])).name}
                />
              </Col>
              <Col xs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.resourceTypeCode' })}
                  value={this.refLookup(referenceTables.instanceTypes, _.get(instance, ['instanceTypeId'])).code}
                />
              </Col>
              <Col cs={3}>
                <KeyValue
                  label={formatMsg({ id: 'ui-inventory.resourceTypeSource' })}
                  value={this.refLookup(referenceTables.instanceTypes, _.get(instance, ['instanceTypeId'])).source}
                />
              </Col>
            </Row>
            <Row>
              { (instance.instanceFormatIds && instance.instanceFormatIds.length > 0) &&
              <MultiColumnList
                id="list-formats"
                contentData={instance.instanceFormatIds.map((formatId) => { return { 'id': formatId }; })}
                visibleColumns={['Category', 'Term', 'Code', 'Source']}
                formatter={formatsRowFormatter}
                ariaLabel="Formats"
                containerRef={(ref) => { this.resultsList = ref; }}
              />
            }
            </Row>
            { (instance.languages.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.language' })} value={formatters.languagesFormatter(instance)} />
              </Col>
            </Row>
          }
            <Row>
              <Col xs={6}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.publicationFrequency' })} value={_.get(instance, ['publicationFrequency'], []).map((desc, i) => <div key={i}>{desc}</div>)} />
              </Col>
              <Col xs={6}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.publicationRange' })} value={_.get(instance, ['publicationRange'], []).map((desc, i) => <div key={i}>{desc}</div>)} />
              </Col>
            </Row>
          </Accordion>
          <Accordion
            open={this.state.accordions.notesAccordion}
            id="notesAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.notes' })}
          >
            { (instance.notes.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.notes' })} value={_.get(instance, ['notes'], []).map((note, i) => <div key={i}>{note}</div>)} />
              </Col>
            </Row>
          }
          </Accordion>
          <Accordion
            open={this.state.accordions.electronicAccessAccordion}
            id="electronicAccessAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.electronicAccess' })}
          >
            { (instance.electronicAccess.length > 0) &&
            <MultiColumnList
              id="list-electronic-access"
              contentData={instance.electronicAccess}
              visibleColumns={['URL relationship', 'URI', 'Link text', 'Materials specified', 'URL public note']}
              formatter={electronicAccessRowFormatter}
              ariaLabel="Electronic access"
              containerRef={(ref) => { this.resultsList = ref; }}
            />
          }
          </Accordion>
          <Accordion
            open={this.state.accordions.subjectsAccordion}
            id="subjectsAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.subjects' })}
          >
            { (instance.subjects.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={formatMsg({ id: 'ui-inventory.subjectHeadings' })} value={_.get(instance, ['subjects'], []).map((sub, i) => <div key={i}>{sub}</div>)} />
              </Col>
            </Row>
          }
          </Accordion>
          <Accordion
            open={this.state.accordions.classificationAccordion}
            id="classificationAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.classification' })}
          >
            { (instance.classifications.length > 0) &&
            <MultiColumnList
              id="list-classifications"
              contentData={instance.classifications}
              rowMetadata={['classificationTypeId']}
              visibleColumns={['Classification identifier type', 'Classification']}
              formatter={classificationsRowFormatter}
              ariaLabel="Classifications"
              containerRef={(ref) => { this.resultsList = ref; }}
            />
          }
          </Accordion>
          { (!holdingsrecordid && !itemid) ?
            <Switch>
              <Route
                path="/inventory/viewsource/"
                render={() => (
                  <this.cViewMarc
                    instance={instance}
                    stripes={stripes}
                    match={this.props.match}
                    onClose={this.closeViewMarc}
                    paneWidth={this.props.paneWidth}
                  />
                )}
              />
              <Route
                path="/inventory/view/"
                render={() => (
                  <this.cHoldings
                    dataKey={id}
                    id={id}
                    accordionToggle={this.handleAccordionToggle}
                    accordionStates={this.state.accordions}
                    instance={instance}
                    referenceTables={referenceTables}
                    match={this.props.match}
                    stripes={stripes}
                    location={location}
                  />
                )}
              />
            </Switch>
            :
            null
          }
          { (holdingsrecordid && !itemid) ?
            <this.cViewHoldingsRecord id={id} holdingsrecordid={holdingsrecordid} {...this.props} onCloseViewHoldingsRecord={this.closeViewHoldingsRecord} />
            : null
          }
          { (holdingsrecordid && itemid) ?
            <this.cViewItem id={id} holdingsRecordId={holdingsrecordid} itemId={itemid} {...this.props} onCloseViewItem={this.closeViewItem} />
            : null
          }
          <Row>
            <Col sm={12}>{newHoldingsRecordButton}</Col>
          </Row>
          <Layer isOpen={query.layer ? query.layer === 'edit' : false} label={formatMsg({ id: 'ui-inventory.editInstanceDialog' })}>
            <InstanceForm
              onSubmit={(record) => { this.update(record); }}
              initialValues={instance}
              onCancel={this.closeEditInstance}
              referenceTables={referenceTables}
              stripes={stripes}
            />
          </Layer>
          <Layer isOpen={query.layer ? query.layer === 'createHoldingsRecord' : false} label={formatMsg({ id: 'ui-inventory.addNewHoldingsDialog' })}>
            <HoldingsForm
              form={instance.id}
              id={instance.id}
              key={instance.id}
              initialValues={{ instanceId: instance.id }}
              onSubmit={(record) => { this.createHoldingsRecord(record); }}
              onCancel={this.onClickCloseNewHoldingsRecord}
              okapi={okapi}
              formatMsg={formatMsg}
              instance={instance}
              referenceTables={referenceTables}
              stripes={stripes}
            />
          </Layer>
          <Accordion
            open={this.state.accordions.analyticsAccordion}
            id="analyticsAccordion"
            onToggle={this.handleAccordionToggle}
            label={formatMsg({ id: 'ui-inventory.relatedInstances' })}
          >
            { (instance.childInstances.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={referenceTables.instanceRelationshipTypes.find(irt => irt.id === instance.childInstances[0].instanceRelationshipTypeId).name + ' (M)'} value={formatters.childInstancesFormatter(instance, referenceTables.instanceRelationshipTypes, location)} />
              </Col>
            </Row>
          }
            { (instance.parentInstances.length > 0) &&
            <Row>
              <Col xs={12}>
                <KeyValue label={referenceTables.instanceRelationshipTypes.find(irt => irt.id === instance.parentInstances[0].instanceRelationshipTypeId).name} value={formatters.parentInstancesFormatter(instance, referenceTables.instanceRelationshipTypes, location)} />
              </Col>
            </Row>
          }
          </Accordion>
        </Pane>
      </div>
    ) : null;
  }
}

ViewInstance.propTypes = {
  stripes: PropTypes.shape({
    connect: PropTypes.func.isRequired,
    locale: PropTypes.string.isRequired,
    logger: PropTypes.object.isRequired,
    intl: PropTypes.shape({
      formatMessage: PropTypes.func.isRequired,
    }),
  }).isRequired,
  resources: PropTypes.shape({
    selectedInstance: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
  }).isRequired,
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string,
  }).isRequired,
  referenceTables: PropTypes.object.isRequired,
  mutator: PropTypes.shape({
    selectedInstance: PropTypes.shape({
      PUT: PropTypes.func.isRequired,
    }),
    holdings: PropTypes.shape({
      POST: PropTypes.func.isRequired,
    }),
    query: PropTypes.object.isRequired,
  }),
  onClose: PropTypes.func,
  onCopy: PropTypes.func,
  paneWidth: PropTypes.string.isRequired,
  okapi: PropTypes.object,
};

export default ViewInstance;
