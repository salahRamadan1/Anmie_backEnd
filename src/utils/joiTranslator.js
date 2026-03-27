// src/utils/joiTranslator.js
export const translateJoiError = (detail, t) => {
    const type = detail?.type;
    const context = detail?.context || {};

    const v = t?.validation || {}; // ✅ لو t undefined مش هيكسر

    // (اختياري) Debug مرة واحدة
    // console.log("t.validation keys:", Object.keys(v), "type:", type, "context:", context);

    switch (type) {
        case "any.required":
            return v.required || "This field is required";

        case "string.base":
            return v.string || "Invalid value";

        case "string.email":
            return v.email || "Invalid email";

        case "string.min": {
            console.log("AR MIN TEMPLATE:", t?.validation?.min); // لازم يطلع نص عربي
            const template = v.min || "Minimum length is {{limit}}";
            return String(template).replace("{{limit}}", String(context.limit ?? ""));
        }

        case "string.max": {
            const template = v.max || "Maximum length is {{limit}}";
            return String(template).replace("{{limit}}", String(context.limit ?? ""));
        }

        default:
            return (detail?.message ? String(detail.message).replace(/"/g, "") : "Invalid value");
    }
};
