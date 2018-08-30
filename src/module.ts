///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import {MetricsPanelCtrl} from 'app/plugins/sdk';

import * as FS from '../node_modules/ryantxu-file-system-datasource/src/FileSystem';

import config from 'app/core/config';

export const FILE_SYSTEM_KEY = "ryantxu-file-system-datasource";

//import $ from 'jquery';
import _ from 'lodash';

class FileBrowserCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';
  static scrollable = true;

  // User Navigation Path
  path: string = '/';

  serverId: number;
  server: FS.FileSystem;
  directory: FS.DirectoryInfo;

  // key for what fs is set
  serverNames: string[];

  // actually already defined!
  loading: boolean = false;

  /** @ngInject */
  constructor($scope, $injector, public datasourceSrv) {
    super($scope, $injector);

    //
    _.defaults(this.panel, {
      root: '/',
      allowNavigation: true,
      showPath: true,
    });

    this.events.on('panel-initialized', this.onPanelInitalized.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
  }

  onKeyPress( event:any ) {
    if(event.which === 13) {
      this._navigate(null);
    }
  }

  // File System changed in the UI
  onFileSystemChanged() {
    this.loadDatasource(this.datasourceName, true);
  }

  loadDatasource(name, dorefresh=false) {
    this.datasourceSrv.get(name).then( ds => {
      const fs = ds.getFileSystem();
      if(fs) {
        this.server = fs;
      }
      const cfg = config.datasources[ds.name];
      if(cfg) {
        this.serverId = cfg.id;
      }
      // Same as super.setDatasource() but without refresh
      this.panel.datasource = name;
      this.datasourceName = name;
      this.datasource = null;

      if(dorefresh) {
        this.refresh();
      }
    });
  }

  // overrides MetricPanelCtrl
  setDatasource(datasource) {
    super.setDatasource(datasource);
    this.loadDatasource(this.panel.datasource);
  }

  onPanelInitalized() {
    if(this.panel.datasource) {
      this.loadDatasource(this.panel.datasource);
    }
    else {
      // Default to the first file system
      const names = this.getFileServerNames();
      if(names && names.length>0) {
        this.loadDatasource(names[0]);
      }
    }
  }

  configChanged() {
    console.log('Config Changed');
    this.refresh();
  }

  onRefresh() {
    console.log('onRefresh');
    this._navigate(null);
  }

  updateRootPath() {
    this.panel.root = this._getRequestPath();
    this.path = '/';
    this.directory = null;
    this.refresh();
  }

  static _makeSureItStartsAndEndsWithSlash(v:string):string {
    if(!v) {
      return '/';
    }
    if(!v.startsWith('/')) {
      v = '/' + v;
    }
    if(!v.endsWith('/')) {
      return v + '/';
    }
    return v;
  }

  _updatePath(rel:string):boolean {
    if(rel && rel.length > 0) {
      const dnorm = FileBrowserCtrl._makeSureItStartsAndEndsWithSlash(this.path);
      if('..'===rel) {
        const idx =  dnorm.lastIndexOf('/', dnorm.length-2);
        this.path = dnorm.substring(0,idx+1);
        return true;
      }
      if(rel.startsWith('/')) {
        this.path = this.path + rel.substring(1);
      }
      else {
        this.path = this.path + rel;
      }
      return true;
    }
    return false;
  }

  _getRequestPath():string {
    this.panel.root = FileBrowserCtrl._makeSureItStartsAndEndsWithSlash(this.panel.root);
    this.path = FileBrowserCtrl._makeSureItStartsAndEndsWithSlash(this.path);
    if(this.path.length > 1) {
      if(this.panel.root.length > 1) {
        return this.panel.root + this.path.substr(1);
      }
      return this.path;
    }
    return this.panel.root;
  }


  _navigate(rel:string) {
    if(this.server) {
      delete this.error;
      this.loading = true;
      this._updatePath(rel);
      const req = this._getRequestPath(); // will normalize
      this.server.list(req).then( d => {
        this.directory = d;
      }).catch( err => {
        // See:
        // https://github.com/grafana/grafana/blob/master/public/app/features/panel/metrics_panel_ctrl.ts#L107
        this.loading = false;
        this.error = err.message || 'Request Error';
        this.inspector = { error: err };

        if (err.data) {
          if (err.data.message) {
            this.error = err.data.message;
          }
          if (err.data.error) {
            this.error = err.data.error;
          }
        }

        this.events.emit('data-error', err);
        console.log('Panel data error:', err);
      }).finally(() => {
        this.loading = false;
      });
    }
  }

  onRender() {
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
    return _.chain(this.datasourceSrv.getAll())
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
      this._navigate(file.name);
      return;
    }

    console.log('CLICKED file:', file);
  }
}

export {FileBrowserCtrl, FileBrowserCtrl as PanelCtrl};
