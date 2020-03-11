"use strict";
/**
 * @packageDocumentation
 * @module ObnizCore
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dialogPollyfill_1 = __importDefault(require("./libs/webpackReplace/dialogPollyfill"));
const ObnizSystemMethods_1 = __importDefault(require("./ObnizSystemMethods"));
class ObnizUIs extends ObnizSystemMethods_1.default {
    constructor(id, options) {
        super(id, options);
    }
    /**
     * This closes the current connection.
     * You need to set auto_connect to false. Otherwise the connection will be recovered.
     *
     * ```javascript
     * var obniz = new Obniz('1234-5678', {
     *   auto_connect: false,
     *   reset_obniz_on_ws_disconnection: false
     * });
     *
     * obniz.connect();
     * obniz.onconnect = async function() {
     *   obniz.io0.output(true);
     *   obniz.close();
     * }
     * ```
     */
    close() {
        super.close();
        this.updateOnlineUI();
    }
    isValidObnizId(str) {
        if (typeof str !== "string" || str.length < 8) {
            return null;
        }
        str = str.replace("-", "");
        let id = parseInt(str);
        if (isNaN(id)) {
            id = null;
        }
        return id !== null;
    }
    wsconnect(desired_server) {
        this.showOffLine();
        if (!this.isValidObnizId(this.id)) {
            if (this.isNode) {
                this.error("invalid obniz id");
            }
            else {
                const filled = _ReadCookie("obniz-last-used") || "";
                this.prompt(filled, (obnizid) => {
                    this.id = obnizid;
                    this.wsconnect(desired_server);
                });
            }
            return;
        }
        super.wsconnect(desired_server);
    }
    prompt(filled = "", callback) {
        ObnizUIs._promptQueue.push({ filled, callback });
        this._promptNext();
    }
    _promptNext() {
        if (ObnizUIs._promptWaiting) {
            return;
        }
        const next = ObnizUIs._promptQueue.shift();
        if (next) {
            this._promptOne(next.filled, next.callback);
        }
    }
    _promptOne(filled, callback) {
        ObnizUIs._promptWaiting = true;
        let result = "";
        new Promise((resolve) => {
            const text = filled;
            const selectorId = `obniz-id-prompt${Math.floor(Math.random() * 10000)}`;
            let css = dialogPollyfill_1.default.css;
            css +=
                `dialog#${selectorId}::backdrop {\n` +
                    "  background: rgba(0, 0, 0, 0.5);\n" +
                    "  animation: modal-open .4s ease;\n" +
                    "}\n" +
                    "\n" +
                    `dialog#${selectorId}[open] {\n` +
                    "    position: fixed;\n" +
                    "    bottom: auto;\n" +
                    "    top: 10px;" +
                    "    animation: modal-slide .5s ease;\n" +
                    "    border: none;" +
                    "    padding: 0;" +
                    "}\n" +
                    `dialog#${selectorId} .contents {\n` +
                    "    padding: 1em;" +
                    "}\n" +
                    `dialog#${selectorId} button {\n` +
                    "    background-color: #00a4e3;\n" +
                    "    border-color: #00a4e3;\n" +
                    "    color: white;\n" +
                    "}" +
                    "@keyframes modal-open {\n" +
                    "  0% {\n" +
                    "    opacity: 0;\n" +
                    "  }\n" +
                    "  100%{\n" +
                    "    opacity: 1;\n" +
                    "  }\n" +
                    "}\n" +
                    "\n" +
                    "@keyframes modal-slide {\n" +
                    "  0% {\n" +
                    "    transform: translateY(-20px);\n" +
                    "  }\n" +
                    "  100%{\n" +
                    "    transform: translateY(0);\n" +
                    "  }\n" +
                    "}";
            let html = "";
            html += `<dialog id='${selectorId}'><div class="contents">`;
            html += `Connect obniz device<br/>`;
            html += ` <form method="dialog">`;
            html += ` <input type="text" name="obniz-id" id="return_value" value="${text}" placeholder="obniz id">`;
            html += '  <button id="close">Connect</button>';
            html += "</form>";
            html += "</div></dialog>";
            html += "<style>";
            html += css;
            html += "</style>";
            const div = document.createElement("div");
            div.innerHTML = html;
            const dialog = div.querySelector("dialog");
            dialog.addEventListener("click", () => {
                // cancel
                dialog.querySelector("#return_value").value = "";
                dialog.close();
                resolve();
            });
            dialog.querySelector(".contents").addEventListener("click", (event) => {
                event.stopPropagation();
            });
            dialog.addEventListener("close", (param) => {
                const inputValue = dialog.querySelector("#return_value").value;
                div.parentElement.removeChild(div);
                result = inputValue;
                resolve();
            });
            dialog.addEventListener("cancel", (param) => {
                // escape key
                const inputValue = dialog.querySelector("#return_value").value;
                div.parentElement.removeChild(div);
                resolve();
            });
            document.body.appendChild(div);
            dialogPollyfill_1.default.dialogPolyfill.registerDialog(dialog);
            dialog.showModal();
        }).then(() => {
            ObnizUIs._promptWaiting = false;
            if (result && result.length > 0) {
                // @ts-ignore
                callback(result);
            }
            this._promptNext();
        });
    }
    showAlertUI(obj) {
        if (this.isNode || !document.getElementById(this.options.debug_dom_id)) {
            return;
        }
        const dom = `
    <div style="background-color:${obj.alert === "warning" ? "#ffee35" : "#ff7b34"}">${obj.message}</div>`;
        document.getElementById(this.options.debug_dom_id).insertAdjacentHTML("beforeend", dom);
    }
    getDebugDoms() {
        if (this.isNode) {
            return;
        }
        const loaderDom = document.querySelector("#loader");
        const debugDom = document.querySelector("#" + this.options.debug_dom_id);
        let statusDom = document.querySelector("#" + this.options.debug_dom_id + " #online-status");
        if (debugDom && !statusDom) {
            statusDom = document.createElement("div");
            statusDom.id = "online-status";
            statusDom.style.color = "#FFF";
            statusDom.style.padding = "5px";
            statusDom.style.textAlign = "center";
            debugDom.insertBefore(statusDom, debugDom.firstChild);
        }
        return { loaderDom, debugDom, statusDom };
    }
    /* online offline */
    _callOnConnect() {
        this.updateOnlineUI();
        super._callOnConnect();
    }
    _disconnectLocal() {
        super._disconnectLocal();
        this.updateOnlineUI();
    }
    updateOnlineUI() {
        if (this.isNode) {
            return;
        }
        const isConnected = this.socket && this.socket.readyState === 1;
        const isConnectedLocally = this.socket_local && this.socket_local.readyState === 1;
        if (isConnected && isConnectedLocally) {
            this.showOnLine(true);
        }
        else if (isConnected) {
            this.showOnLine(false);
        }
        else {
            this.showOffLine();
        }
    }
    showOnLine(isConnectedLocally) {
        if (this.isNode) {
            return;
        }
        const doms = this.getDebugDoms();
        if (doms.loaderDom) {
            doms.loaderDom.style.display = "none";
        }
        if (doms.statusDom) {
            doms.statusDom.style.backgroundColor = isConnectedLocally ? "#0cd362" : "#31965d";
            doms.statusDom.style.color = "#FFF";
            doms.statusDom.innerHTML =
                (this.id ? "online : " + this.id : "online") + (isConnectedLocally ? " via local_connect" : " via internet");
        }
    }
    showOffLine() {
        if (this.isNode) {
            return;
        }
        const doms = this.getDebugDoms();
        if (doms.loaderDom) {
            doms.loaderDom.style.display = "block";
        }
        if (doms.statusDom) {
            doms.statusDom.style.backgroundColor = "#d9534f";
            doms.statusDom.style.color = "#FFF";
            doms.statusDom.innerHTML = this.id ? "offline : " + this.id : "offline";
        }
    }
}
exports.default = ObnizUIs;
ObnizUIs._promptQueue = [];
ObnizUIs._promptWaiting = false;
/**
 *
 * @ignore
 */
function _ReadCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}
//# sourceMappingURL=ObnizUIs.js.map