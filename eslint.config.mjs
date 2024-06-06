import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigRules } from "@eslint/compat";


export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    rules:{
      semi: [2, "never"],
      quotes: [2, "single"],
    }
  }
];