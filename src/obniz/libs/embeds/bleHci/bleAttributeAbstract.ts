/**
 * @packageDocumentation
 * @module ObnizCore.Components.Ble.Hci
 */
import emitter = require("eventemitter3");
import ObnizUtil from "../../utils/util";
import BleHelper from "./bleHelper";
import {UUID} from "./bleTypes";

export default class BleAttributeAbstract<ParentClass, ChildrenClass> {

  /**
   * @ignore
   */
  get childrenClass(): any {
    return Object;
  }

  /**
   * @ignore
   */
  get childrenName(): string | null {
    return null;
  }

  /**
   * @ignore
   */
  get parentName(): string | null {
    return null;
  }

  /**
   * It is uuid as string.
   *
   * ```javasciprt
   * console.log(attr.uuid); // => '4C84'
   * ```
   */
  public uuid: UUID;

  /**
   * @ignore
   */
  public onwrite?: (result: any) => void;

  /**
   * @ignore
   */
  public onread?: (data: any) => void;

  /**
   * @ignore
   */
  public onwritefromremote?: (address: any, data: any) => void;

  /**
   * @ignore
   */
  public onreadfromremote?: (address: any) => void;

  protected parent: ParentClass | null;
  protected children: ChildrenClass[];
  protected isRemote: boolean;
  protected discoverdOnRemote: any;
  protected data: any;
  protected emitter: any;

  constructor(params: any) {
    this.uuid = BleHelper.uuidFilter(params.uuid);
    this.parent = null;
    this.children = [];

    this.isRemote = false;
    this.discoverdOnRemote = false;

    this.data = params.data || null;
    if (!this.data && params.text) {
      this.data = ObnizUtil.string2dataArray(params.text);
    }
    if (!this.data && params.value) {
      this.data = [params.value];
    }

    if (params[this.childrenName!]) {
      for (const child of params[this.childrenName!]) {
        this.addChild(child);
      }
    }

    this.setFunctions();

    this.emitter = new emitter();
  }

  /**
   * @ignore
   * @param child
   */
  public addChild(child: { uuid: UUID } | ChildrenClass) {
    if (!(child instanceof this.childrenClass)) {
      const childrenClass: any = this.childrenClass;
      child = new childrenClass(child);
    }
    const childobj = child as any;
    childobj.parent = this;

    this.children.push(childobj);
    return childobj;
  }

  /**
   * @ignore
   * @param uuid
   */
  public getChild(uuid: UUID): ChildrenClass | null {
    uuid = BleHelper.uuidFilter(uuid);
    const result = this.children
      .filter((element: any) => {
        return BleHelper.uuidFilter(element.uuid) === uuid;
      })
      .shift();
    if (!result) {
      return null;
    }
    return result;
  }

  /**
   * @ignore
   */
  public toJSON() {
    const obj: any = {
      uuid: BleHelper.uuidFilter(this.uuid),
    };

    if (this.childrenName) {
      const key: any = this.childrenName;
      obj[key] = this.children;
    }
    if (this.data) {
      obj.data = this.data;
    }
    return obj;
  }

  /**
   * WS COMMANDS
   */

  /**
   * @ignore
   */
  public read() {
  }

  /**
   * @ignore
   */
  public write(data: any, needResponse?: boolean) {
  }

  /**
   * @ignore
   */
  public writeNumber(val: any, needResponse?: any) {
    this.write([val], needResponse);
  }

  /**
   * @ignore
   */
  public writeText(str: any, needResponse?: any) {
    this.write(ObnizUtil.string2dataArray(str), needResponse);
  }

  /**
   * @ignore
   */
  public readWait() {
    return new Promise((resolve: any, reject: any) => {
      this.emitter.once("onread", (params: any) => {
        if (params.result === "success") {
          resolve(params.data);
        } else {
          reject(new Error("readWait failed"));
        }
      });
      this.read();
    });
  }

  /**
   * @ignore
   */
  public writeWait(data: any, needResponse: any) {
    return new Promise((resolve: any, reject: any) => {
      this.emitter.once("onwrite", (params: any) => {
        if (params.result === "success") {
          resolve(true);
        } else {
          reject(new Error("writeWait failed"));
        }
      });
      this.write(data, needResponse);
    });
  }

  /**
   * @ignore
   */
  public writeTextWait(data: any) {
    return new Promise((resolve: any, reject: any) => {
      this.emitter.once("onwrite", (params: any) => {
        if (params.result === "success") {
          resolve(true);
        } else {
          reject(new Error("writeTextWait failed"));
        }
      });
      this.writeText(data);
    });
  }

  /**
   * @ignore
   */
  public writeNumberWait(data: any) {
    return new Promise((resolve: any, reject: any) => {
      this.emitter.once("onwrite", (params: any) => {
        if (params.result === "success") {
          resolve(true);
        } else {
          reject(new Error("writeNumberWait failed"));
        }
      });
      this.writeNumber(data);
    });
  }

  /**
   * @ignore
   */
  public readFromRemoteWait() {
    return new Promise((resolve: any) => {
      this.emitter.once("onreadfromremote", () => {
        resolve();
      });
    });
  }

  /**
   * @ignore
   */
  public writeFromRemoteWait() {
    return new Promise((resolve: any) => {
      this.emitter.once("onreadfromremote", (params: any) => {
        resolve(params.data);
      });
    });
  }

  /**
   * @ignore
   * @param err
   */
  public onerror(err: any) {
    console.error(err.message);
  }

  /**
   * @ignore
   * @param notifyName
   * @param params
   */
  public notifyFromServer(notifyName: any, params: any) {
    this.emitter.emit(notifyName, params);
    switch (notifyName) {
      case "onerror": {
        this.onerror(params);
        break;
      }
      case "onwrite": {
        if (this.onwrite) {
          this.onwrite(params.result);
        }
        break;
      }
      case "onread": {
        if (this.onread) {
          this.onread(params.data);
        }
        break;
      }
      case "onwritefromremote": {
        if (this.onwritefromremote) {
          this.onwritefromremote(params.address, params.data);
        }
        break;
      }
      case "onreadfromremote": {
        if (this.onreadfromremote) {
          this.onreadfromremote(params.address);
        }
        break;
      }
    }
  }

  protected setFunctions() {
    let childrenName: any = this.childrenName;
    if (childrenName) {
      childrenName =
        childrenName.charAt(0).toUpperCase() + childrenName.slice(1);
      const childName: any = childrenName.slice(0, -1);

      let funcName: string = "add" + childName;
      (this as any)[funcName] = this.addChild;

      funcName = "get" + childName;
      (this as any)[funcName] = this.getChild;
    }

    const parentName: any = this.parentName;
    if (parentName) {
      Object.defineProperty(this, parentName, {
        get() {
          return this.parent;
        }
        ,
        set(newValue: any) {
          this.parent = newValue;
        }
        ,
      })
      ;
    }
  }
}
