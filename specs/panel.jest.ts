///<reference path="../node_modules/@types/jest/index.d.ts" />

import moment from 'moment';

import TemplateSrv from './lib/template_srv_stub';
import {FileBrowserCtrl, PanelCtrl} from '../src/module';

//import * as panel_json_v004 from './res/panel_json_v004.json';
import {MetricsPanelCtrl} from 'app/plugins/sdk';

describe('Plotly Panel', () => {
  const injector = {
    get: () => {
      return {
        timeRange: () => {
          return {
            from: '',
            to: '',
          };
        },
      };
    },
  };

  const scope = {
    $on: () => {},
  };

  const templateSrv = new TemplateSrv();
  const variableSrv = {};

  FileBrowserCtrl.prototype.panel = {
    events: {
      on: () => {},
    },
    gridPos: {
      w: 100,
    },
  };

  const ctx = <any>{};
  beforeEach(() => {
    ctx.ctrl = new FileBrowserCtrl(scope, injector, templateSrv, variableSrv);
    ctx.ctrl.events = {
      emit: () => {},
    };
    ctx.ctrl.annotationsPromise = Promise.resolve({});
    ctx.ctrl.updateTimeRange();
  });

  const epoch = 1505800000000;
  Date.now = () => epoch;

  describe('check Defaults', () => {
    beforeEach(() => {
      // nothing specal
    });

    it('it should use default configs', () => {
      expect(20).toEqual(20);
    });
  });

  // describe('check migration from 0.0.4', () => {
  //   beforeEach(() => {
  //     ctx.ctrl.panel = panel_json_v004;
  //     ctx.ctrl.onPanelInitalized();
  //   });

  //   it('it should now have have a version', () => {
  //     expect(ctx.ctrl.panel.version).toBe(PlotlyPanelCtrl.configVersion);
  //     expect(ctx.ctrl.cfg.layout.margin).toBeUndefined();
  //   });
  // });
});
