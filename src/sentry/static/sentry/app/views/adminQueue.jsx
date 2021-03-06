/*eslint getsentry/jsx-needs-il8n:0*/
import React from 'react';

import ApiMixin from '../mixins/apiMixin';
import LoadingError from '../components/loadingError';
import LoadingIndicator from '../components/loadingIndicator';
import InternalStatChart from '../components/internalStatChart';
import {Select2Field} from '../components/forms';

export default React.createClass({
  mixins: [ApiMixin],

  getInitialState() {
    return {
      timeWindow: '1h',
      since: new Date().getTime() / 1000 - 3600 * 24 * 7,
      resolution: '1h',
      loading: true,
      error: false,
      taskName: null,
      taskList: []
    };
  },

  componentDidMount() {
    this.fetchData();
  },

  fetchData() {
    this.api.request('/internal/queue/tasks/', {
      method: 'GET',
      success: data => {
        this.setState({
          taskList: data,
          loading: false,
          error: false
        });
      },
      error: data => {
        this.setState({
          error: true
        });
      }
    });
  },

  changeWindow(timeWindow) {
    let seconds;
    if (timeWindow === '1h') {
      seconds = 3600;
    } else if (timeWindow === '1d') {
      seconds = 3600 * 24;
    } else if (timeWindow === '1w') {
      seconds = 3600 * 24 * 7;
    } else {
      throw new Error('Invalid time window');
    }
    this.setState({
      since: new Date().getTime() / 1000 - seconds,
      timeWindow
    });
  },

  changeTask(value) {
    this.setState({activeTask: value});
  },

  render() {
    let {activeTask, taskList} = this.state;

    return (
      <div>
        <div className="btn-group pull-right">
          {['1h', '1d', '1w'].map(r => {
            return (
              <a
                className={`btn btn-sm ${r == this.state.timeWindow ? 'btn-primary' : 'btn-default'}`}
                onClick={() => this.changeWindow(r)}
                key={r}>
                {r}
              </a>
            );
          })}
        </div>

        <h3 className="no-border">Queue Overview</h3>

        <div className="box">
          <div className="box-header"><h3>Global Throughput</h3></div>
          <div className="box-content with-padding">
            <InternalStatChart
              since={this.state.since}
              resolution={this.state.resolution}
              stat="jobs.all.started"
              label="jobs started"
            />
          </div>
        </div>

        <h3 className="no-border">Task Details</h3>

        {this.state.loading
          ? <LoadingIndicator />
          : this.state.error
              ? <LoadingError onRetry={this.fetchData} />
              : <div>
                  <div>
                    <label>Show details for task:</label>
                    <Select2Field
                      name="task"
                      onChange={this.changeTask}
                      value={activeTask}
                      allowClear={true}
                      choices={[''].concat(...taskList).map(t => [t, t])}
                    />
                  </div>
                  {activeTask
                    ? <div>
                        <div className="box box-mini" key="jobs.started">
                          <div className="box-header">
                            Jobs Started <small>{activeTask}</small>
                          </div>
                          <div className="box-content with-padding">
                            <InternalStatChart
                              since={this.state.since}
                              resolution={this.state.resolution}
                              stat={`jobs.started.${this.state.activeTask}`}
                              label="jobs"
                              height={100}
                            />
                          </div>
                        </div>
                        <div className="box box-mini" key="jobs.finished">
                          <div className="box-header">
                            Jobs Finished <small>{activeTask}</small>
                          </div>
                          <div className="box-content with-padding">
                            <InternalStatChart
                              since={this.state.since}
                              resolution={this.state.resolution}
                              stat={`jobs.finished.${this.state.activeTask}`}
                              label="jobs"
                              height={100}
                            />
                          </div>
                        </div>
                      </div>
                    : null}
                </div>}
      </div>
    );
  }
});
