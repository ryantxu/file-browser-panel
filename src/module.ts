///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import {PanelCtrl} from 'app/plugins/sdk';
import * as F from './FileServer';

//import $ from 'jquery';
import _ from 'lodash';

class FileBrowserCtrl extends PanelCtrl {
  static templateUrl = 'partials/module.html';
  static scrollable = true;

  server: F.FileServer;
  directory: F.DirectoryInfo;

  // actually already defined!
  loading: boolean = false;

  /** @ngInject */
  constructor($scope, $injector, protected $http) {
    super($scope, $injector);

    _.defaults(this.panel, {
      path: '',
      show: {
        path: true,
        directories: true,
      },
      server: { 
        type: 'NGINX',
        url: 'https://your-host/root/',
      }
    });

    this.events.on('panel-initialized', this.onPanelInitalized.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
  }

  onPanelInitalized() {
    this.configChanged();
  }

  configChanged() {
    console.log('Config Changed');
    this.initServer();
  }

  initServer() {
    if('NGINX'===this.panel.server.type) {
      this.server = new F.FileServerNGINX(this.panel.server, this.$http);
    }
    else {
      console.error('not sure how to make:', this.panel.server);
      return;
    }
  }

  onRefresh() {
    console.log('onRefresh');
    this._load(this.panel.path);
  }

  _load(path:string, dir?:F.DirectoryInfo) {
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
    this.addEditorTab(
      'Options',
      'public/plugins/' + this.pluginId + '/partials/editor.options.html',
      1
    );
    this.editorTabIndex = 1;
  }

  clicked(file:F.FileInfo, evt?:any ) {
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
