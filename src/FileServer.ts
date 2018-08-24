import _ from 'lodash';

export class FileInfo {
  name: string;
  modified: any; // moment(?)
  browsable: boolean = false;

  type?: string;
  url?: string;
  meta?: Map<string,object>;
}

export class DirectoryInfo {
  path: string;
  files: FileInfo[];
}

export abstract class FileServer {
  /** @ngInject */
  constructor(protected options) {

  }
  
  abstract list(path:string, dir?:DirectoryInfo): Promise<DirectoryInfo>;
}

export class FileServerNGINX extends FileServer {

  /** @ngInject */
  constructor(protected options, protected $http) {
    super(options);
  }

  list(path:string, dir?:DirectoryInfo): Promise<DirectoryInfo> {
    let base = this.options.url + path;
    if(dir && dir.path) {
      if(path =='..') {
        base = this.options.url + dir.path.substring(dir.path.lastIndexOf('/'));
      }
      else {
        base = this.options.url + dir.path + path
      }
    }
    if(!base.endsWith('/')) {
      base += '/';
    }
    return this.$http({
      method: 'GET',
      url: base,
    }).then( rsp => {
      let d = new DirectoryInfo();
      d.path = base.substring(this.options.url.length);
      d.files = _.map(rsp.data, (r) => {
        let f = new FileInfo();
        f.name = r.name;
        f.type = r.type;
        f.browsable = ('directory'===r.type);
        if(!f.browsable) {
          f.url = base + f.name;
        }
        return f;
      });
      return d; 
    });
  }
}