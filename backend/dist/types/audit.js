"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditStatus = exports.AuditCategory = void 0;
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["AUTH"] = "AUTH";
    AuditCategory["ACCESS"] = "ACCESS";
    AuditCategory["DATA"] = "DATA";
    AuditCategory["CONFIG"] = "CONFIG";
    AuditCategory["VERIFICATION"] = "VERIFICATION";
    AuditCategory["SYSTEM"] = "SYSTEM";
})(AuditCategory || (exports.AuditCategory = AuditCategory = {}));
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["SUCCESS"] = "SUCCESS";
    AuditStatus["FAILURE"] = "FAILURE";
    AuditStatus["WARNING"] = "WARNING";
    AuditStatus["INFO"] = "INFO";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
