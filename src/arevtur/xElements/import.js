// each group can only depend on the groups above it

require('./arrangeableList/ArrangeableList');
require('./autocompleteInput/AutocompleteInput');
require('./collapsable/Collapsable');
require('./configToggleButton/ConfigToggleButton');
require('./formattedText/FormattedText');
require('./inputImports/InputImports');
require('./inputSet/InputSet');
require('./numericInput/NumericInput');
require('./pathSelect/PathSelect');
require('./tour/Tour');

require('./inputBuildWeight/InputBuildWeight'); // x-numeric-input, x-autocomplete-input
require('./inputBuild/InputBuild'); // x-path-select, x-numeric-input
require('./multiSelectLined/MultiSelectLined'); // x-autocomplete-input
require('./tooltipButton/TooltipButton'); // x-formatted-text

require('./inputBuildWeights/InputBuildWeights'); // x-arrangeable-list, x-input-build-weight
require('./chart/Chart'); // x-tooltip-button
require('./inputTradeParams/InputTradeParams'); // x-autocomplete-input, x-numeric-input, x-tooltip-button, x-multi-select-lined, x-arrangeable-list
require('./itemListing/ItemListing'); // x-tooltip-button
require('./queryProperty/QueryProperty'); // x-autocomplete-input, x-numeric-input, x-tooltip-button

require('./inputs/Inputs'); // x-autocomplete-input,  x-config-toggle-button,  x-input-build,  x-input-imports, x-arrangeable-list,  x-input-trade-params
require('./results/Results'); // x-autocomplete-input, x-chart
