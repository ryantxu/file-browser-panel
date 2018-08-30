///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import {MetricsPanelCtrl} from 'app/plugins/sdk';

import * as FS from '../node_modules/ryantxu-file-system-datasource/src/FileSystem';


export const FILE_SYSTEM_KEY = "ryantxu-file-system-datasource";

//import $ from 'jquery';
import _ from 'lodash';

class FileBrowserCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';
  static scrollable = true;


  server: FS.FileSystem;
  directory: FS.DirectoryInfo;

  // key for what fs is set
  serverNames: string[];

  // actually already defined!
  loading: boolean = false;

  /** @ngInject */
  constructor($scope, $injector, public datasourceSrv) {
    super($scope, $injector);

    _.defaults(this.panel, {
      path: '',
      show: {
        path: true,
        directories: true,
      }
    });

    this.events.on('panel-initialized', this.onPanelInitalized.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
  }

  // File System changed in the UI
  onFileSystemChanged() {
    this.loadDatasource(this.datasourceName);
  }

  loadDatasource(name) {
    this.datasourceSrv.get(name).then( ds => {
      const fs = ds.getFileSystem();
      if(fs) {
        this.server = fs;
      }
      this.setDatasource( ds );
    });
  }

  onPanelInitalized() {
    this.configChanged();
  }

  configChanged() {
    console.log('Config Changed');
  }

  onRefresh() {
    console.log('onRefresh');
    this._load(this.panel.path);
  }

  _load(path:string, dir?:FS.DirectoryInfo) {
    if(this.server) {
      this.loading = true;
      this.server.list(path, dir).then( d => {
        this.panel.path = d.path;
        this.directory = d;
        this.loading = false;
      });
    }
  }

  onRender() {
    console.log('RENDER');

    this.renderingCompleted();
  }

  onInitEditMode() {
    this.editorTabs.splice(1, 1); // remove the 'Metrics Tab'
    this.serverNames = this.getFileServerNames();
    this.addEditorTab(
      'Options',
      'public/plugins/' + this.pluginId + '/partials/editor.options.html',
      1
    );
    this.editorTabIndex = 1;
  }
  
  getFileServerNames(): string[] {
    return _.chain(this.datasourceSrv.getMetricSources())
      .filter( s => {
        return FILE_SYSTEM_KEY === s.meta.id;
      })
      .map( s => {
        return s.name; 
      }).value();
  }

  clicked(file:FS.FileInfo, evt?:any ) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    if(file.browsable) {
      this._load(file.name, this.directory);
      return;
    }

    console.log('CLICKED file:', file);
  }
}

export {FileBrowserCtrl, FileBrowserCtrl as PanelCtrl};
