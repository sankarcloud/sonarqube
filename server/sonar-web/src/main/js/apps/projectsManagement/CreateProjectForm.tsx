/*
 * SonarQube
 * Copyright (C) 2009-2018 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { createProject } from '../../api/components';
import { Organization } from '../../app/types';
import UpgradeOrganizationBox from '../../components/common/UpgradeOrganizationBox';
import VisibilitySelector from '../../components/common/VisibilitySelector';
import Modal from '../../components/controls/Modal';
import { SubmitButton, ResetButtonLink } from '../../components/ui/buttons';
import { translate } from '../../helpers/l10n';
import { getProjectUrl } from '../../helpers/urls';

interface Props {
  onClose: () => void;
  onProjectCreated: () => void;
  organization: Organization;
}

interface State {
  advanced: boolean;
  branch: string;
  createdProject?: { key: string; name: string };
  key: string;
  loading: boolean;
  name: string;
  visibility: string;
  // add index declaration to be able to do `this.setState({ [name]: value });`
  [x: string]: any;
}

export default class CreateProjectForm extends React.PureComponent<Props, State> {
  closeButton?: HTMLElement | null;
  mounted = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      advanced: false,
      branch: '',
      key: '',
      loading: false,
      name: '',
      visibility: props.organization.projectVisibility
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentDidUpdate() {
    // wrap with `setImmediate` because of https://github.com/reactjs/react-modal/issues/338
    setImmediate(() => {
      if (this.closeButton) {
        this.closeButton.focus();
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleAdvancedClick = (event: React.SyntheticEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.currentTarget.blur();
    this.setState(state => ({ advanced: !state.advanced }));
  };

  handleInputChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    this.setState({ [name]: value });
  };

  handleVisibilityChange = (visibility: string) => {
    this.setState({ visibility });
  };

  handleFormSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = {
      name: this.state.name,
      branch: this.state.branch,
      organization: this.props.organization && this.props.organization.key,
      project: this.state.key,
      visibility: this.state.visibility
    };

    this.setState({ loading: true });
    createProject(data).then(
      response => {
        if (this.mounted) {
          this.setState({ createdProject: response.project, loading: false });
          this.props.onProjectCreated();
        }
      },
      () => {
        if (this.mounted) {
          this.setState({ loading: false });
        }
      }
    );
  };

  render() {
    const { organization } = this.props;
    const { createdProject } = this.state;

    return (
      <Modal contentLabel="modal form" onRequestClose={this.props.onClose}>
        {createdProject ? (
          <div>
            <header className="modal-head">
              <h2>{translate('qualifiers.create.TRK')}</h2>
            </header>

            <div className="modal-body">
              <div className="alert alert-success">
                <FormattedMessage
                  defaultMessage={translate(
                    'projects_management.project_has_been_successfully_created'
                  )}
                  id="projects_management.project_has_been_successfully_created"
                  values={{
                    project: (
                      <Link to={getProjectUrl(createdProject.key)}>{createdProject.name}</Link>
                    )
                  }}
                />
              </div>
            </div>

            <footer className="modal-foot">
              <ResetButtonLink
                id="create-project-close"
                innerRef={node => (this.closeButton = node)}
                onClick={this.props.onClose}>
                {translate('close')}
              </ResetButtonLink>
            </footer>
          </div>
        ) : (
          <form id="create-project-form" onSubmit={this.handleFormSubmit}>
            <header className="modal-head">
              <h2>{translate('qualifiers.create.TRK')}</h2>
            </header>

            <div className="modal-body">
              <div className="modal-field">
                <label htmlFor="create-project-name">
                  {translate('name')}
                  <em className="mandatory">*</em>
                </label>
                <input
                  autoFocus={true}
                  id="create-project-name"
                  maxLength={2000}
                  name="name"
                  onChange={this.handleInputChange}
                  required={true}
                  type="text"
                  value={this.state.name}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="create-project-key">
                  {translate('key')}
                  <em className="mandatory">*</em>
                </label>
                <input
                  id="create-project-key"
                  maxLength={400}
                  name="key"
                  onChange={this.handleInputChange}
                  required={true}
                  type="text"
                  value={this.state.key}
                />
              </div>
              <div className="modal-field">
                <label>{translate('visibility')}</label>
                <VisibilitySelector
                  canTurnToPrivate={organization.canUpdateProjectsVisibilityToPrivate}
                  className="little-spacer-top"
                  onChange={this.handleVisibilityChange}
                  visibility={this.state.visibility}
                />
                {!organization.canUpdateProjectsVisibilityToPrivate && (
                  <div className="spacer-top">
                    <UpgradeOrganizationBox organization={organization.key} />
                  </div>
                )}
              </div>
              {this.state.advanced ? (
                <div className="modal-field big-spacer-top">
                  <label htmlFor="create-project-branch">{translate('branch')}</label>
                  <input
                    autoFocus={true}
                    id="create-project-branch"
                    maxLength={200}
                    name="branch"
                    onChange={this.handleInputChange}
                    type="text"
                    value={this.state.branch}
                  />
                </div>
              ) : (
                <div className="modal-field big-spacer-top">
                  <a
                    className="js-more text-muted note"
                    href="#"
                    onClick={this.handleAdvancedClick}>
                    {translate('more')}
                  </a>
                </div>
              )}
            </div>

            <footer className="modal-foot">
              {this.state.loading && <i className="spinner spacer-right" />}
              <SubmitButton disabled={this.state.loading} id="create-project-submit">
                {translate('create')}
              </SubmitButton>
              <ResetButtonLink id="create-project-cancel" onClick={this.props.onClose}>
                {translate('cancel')}
              </ResetButtonLink>
            </footer>
          </form>
        )}
      </Modal>
    );
  }
}
