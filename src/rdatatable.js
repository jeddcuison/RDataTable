/**
 * A React Data Table Component.
 *
 * Version: 1.0.0
 *
 * Features: Consumes JSON data, filter (search), sorting, link edit interface and pagination.
 *
 * Usage example:
 *
 *    using native React:
 *
 *      React.renderComponent(RDataTable({colDefinitions:colDef,
 *                                       data:sampleJson,
 *                                       tableIndex:[optional],
 *                                       selectItemCallback:selectItemHandler}),
 *                                       document.getElementById("table-container"));
 *
 *    using JSX:
 *
 *      <RDataTable colDefinitions={colDef}
 *                  data={this.state.jvmTableData}
 *                  selectItemCallback={this.selectItemCallback}
 *                  tableIndex="id.id"/>
 *
 * Properties:
 *
 * 1. colDef - the table column definition.
 *
 *    var colDef = [{title:"Area Name", key:"areaName"},
 *                  {title:"Property Type", key:"propertyType"},
 *                  {title:"Property Name", key:"propertyName"},
 *                  {title:"Address", key:"addr"},
 *                  {title:"Zip Code", key:"zip"},
 *                  {title:"Phone Number", key:"phone"},
 *                  {title:"Management Company", key:"mgmtCompany"},
 *                  {title:"Units", key:"units"},
 *                  {title:"Location", key:"loc", renderCallback:locationRenderCallback}]
 *
 * 2. data - the data to display in the table.
 *
 *    var data = [{"areaName":"Albany Park",
 *                 "areaNumber":14,
 *                 "propertyType":"Senior",
 *                 "propertyName":"Mayfair Commons",
 *                 "addr":"4444 W. Lawrence Ave.",
 *                 "zip":60630,
 *                 "phone":"773-205-7862",
 *                 "mgmtCompany":"Metroplex, Inc.",
 *                 "units":97,
 *                 "xCoord":1145674.754,
 *                 "yCoord":1931569.979,
 *                 "lat":41.96822423,
 *                 "lon":-87.73974749,
 *                 "loc":"4444 W Lawrence Ave\n(41.968224232060564, -87.73974748655358)"}, {...}]
 *
 * 3. selectItemCallback - callback that is called when a user clicks on a row to select it.
 *
 * 4. tableIndex - a unique numeric index that identifies a row item. If this is not set, RDataTable will create
 *                 one for each row but with the consequence of the selected row not being persistently selected
 *                 when the table's parent is re-rendered. The reason for that is because the data passed by the
 *                 parent may have changed thus the arbitrary ids assigned by the table will no longer be valid.
 *
 */
var RDataTable = React.createClass({
    getInitialState: function() {
        return {
            sortOrderMap: null,
            sortKey: null,
            filterVal: "",
            numberOfRowsToDisplay: "25",
            page: 1,
            selectedRowIdx: null
        }
    },
    componentWillReceiveProps: function(nextProps) {
        if (nextProps.tableIndex === undefined) {
            this.setState({selectedRowIdx:null});
            nextProps.selectItemCallback(null);
        }
    },
    /**
     * Performs data transformation and filtering.
     * Convert data to displayable string format.
     * Also sets visibility property based on the filter.
     *
     * @param data
     * @returns {{data: Array, filterRowCount: number}}
     */
    transformAndFilterData: function(data) {
        var self = this;
        var formattedData = [];
        var filterRowCount = 0;

        var rowIdx = 0;
        data.forEach(function(item) {
            var formattedItem = {};

            formattedItem["rowIdx"] = self.props.tableIndex !== undefined ?  RDataTable.getEndData(item, self.props.tableIndex) : ++rowIdx;
            var hasMatch = false; // used by filter process
            self.props.colDefinitions.forEach(function(col){
                var val;

                if (col.renderCallback !== undefined) {
                    val = col.renderCallback(RDataTable.getEndData(item, col.key), item);
                } else {
                    val = RDataTable.getEndData(item, col.key);
                }

                var tmpVal;
                if (typeof val !== "object") {
                    tmpVal = val;
                } else {
                    tmpVal = RDataTable.getEndData(item, col.key);
                    formattedItem["str-" + col.key.split(".")[0]] = tmpVal; // save String value for sorting purposes
                }

                // Filter process A
                if (col.isVisible !== false) {
                    var tmpStr = $.isNumeric(tmpVal) ? tmpVal.toString() : tmpVal;
                    if (!hasMatch) {
                        if (self.state.filterVal === "" ||
                            (self.state.filterVal !== "" &&
                            tmpStr !== null &&
                            tmpStr.toLowerCase().indexOf(self.state.filterVal.toLowerCase()) > -1)) {
                            hasMatch = true;
                        }
                    }
                }

                formattedItem[col.key.split(".")[0]] = self.toObjValue(col.key, val);

            });

            // Filter process B
            if (hasMatch) {
                filterRowCount++;
                formattedItem["isVisible"] = true;
            } else {
                formattedItem["isVisible"] = false;
            }

            formattedData.push(formattedItem);
        });

        return {data:formattedData, filterRowCount:filterRowCount};
    },
    /**
     * Sorts data.
     * @param data
     * @returns {*}
     */
    sort: function(data) {
        var sortKey = this.state.sortKey;
        var sortOrderMap = this.state.sortOrderMap;
        if (this.state.sortKey !== null) {
            data.sort(function(item1, item2){
                var val1 = RDataTable.getEndData(item1, sortKey);
                val1 = (typeof val1 !== "object") ? val1 : RDataTable.getEndData(item1, "str-" + sortKey);
                var val2 = RDataTable.getEndData(item2, sortKey);
                val2 = (typeof val2 !== "object") ? val2 : RDataTable.getEndData(item2, "str-" + sortKey);

                val1 = $.isNumeric(val1) ? val1 : val1.toLowerCase();
                val2 = $.isNumeric(val2) ? val2 : val2.toLowerCase();

                if (val1 < val2) {
                    return (sortOrderMap[sortKey] === "asc" ?  -1 : 1);
                } else if (val1 > val2) {
                    return (sortOrderMap[sortKey] === "asc" ?  1 : -1);
                }
                return 0;
            });
        }

        return data;
    },
    /**
     * Limits rows (e.g. display current page rows only) to display and does pagination
     * @param data
     * @param numberOfRowsToDisplayLimit
     */
    paginate: function(data, numberOfRowsToDisplayLimit) {

        var visibleRowStartIdx = 0;
        if (numberOfRowsToDisplayLimit !== -1) {
            visibleRowStartIdx = (numberOfRowsToDisplayLimit * this.state.page) - numberOfRowsToDisplayLimit;
        }

        var visibleRowEndIdx = numberOfRowsToDisplayLimit * this.state.page;

        var idx = 0;
        data.forEach(function(item) {
            if (item.isVisible) {
                idx++;
            }
            if (numberOfRowsToDisplayLimit !== -1 &&
                (idx < (visibleRowStartIdx + 1) || visibleRowEndIdx < idx)) {
                item["isVisible"] = false;
            }
        });

    },
    /**
     * Created table rows
     * @param data
     * @returns {Array}
     */
    createTableRows: function(data) {
        var self = this;
        var rows = [];
        var i = 0;
        data.forEach(function(item) {

            if (item.isVisible) {
                i++;
            }

            var oddEvenClassName = (i % 2 === 0) ? "even" : "odd";
            rows.push(new RDataTableRow({className:oddEvenClassName,
                rowItem:item,
                colDefinitions:self.props.colDefinitions,
                selectItemCallback:self.selectItemCallback,
                selectedRowIdx:self.state.selectedRowIdx}));
        });
        return rows;
    },
    render: function() {
        var self = this;
        var maxPage = 1;

        var data = (this.props.data === null || this.props.data === undefined) ? [] : this.props.data;

        var table;
        if (data.length > 0) {

            maxPage = (self.state.numberOfRowsToDisplay === "ALL") ? 1 : Math.ceil(data.length/Number(self.state.numberOfRowsToDisplay));

            // Step 1: Data transformation
            var formattedData = this.transformAndFilterData(data);

            // Step 2: Sorting.
            this.sort(formattedData.data);

            // Step 3: Limit rows to display and pagination
            var numberOfRowsToDisplayLimit = (self.state.numberOfRowsToDisplay === "ALL") ? -1 : Number(self.state.numberOfRowsToDisplay);
            this.paginate(formattedData.data, numberOfRowsToDisplayLimit);

            var rows = this.createTableRows(formattedData.data);

            table = new React.DOM.table({ref:"table", className:"dataTable"},
                new RDataTableHeaderRow({ref:"tableColHeader", colDefinitions:this.props.colDefinitions,
                    setSortKeyCallback:this.setSortKeyCallback,
                    sortKey:this.state.sortKey,
                    sortOrderMap:this.state.sortOrderMap}),
                React.DOM.tbody(null, rows));
        } else {
            table = new React.DOM.div({ref:"table", className:"noDataFoundMsg"}, "The table is empty!");
        }

        return React.DOM.div({className:"dataTables_wrapper"},
            new RDataTableHeader({ref:"tableHeader", filterCallback:this.filterCallback,
                numberOfRowsToDisplay:this.state.numberOfRowsToDisplay,
                selectNumberOfRowsToDisplayCallback:this.selectNumberOfRowsToDisplayCallback}),
            table,
            new RDataTableFooter({ref:"tableFooter", numberOfRowsToDisplay:this.state.numberOfRowsToDisplay,
                rowCount:data.length,
                filterRowCount: formattedData.filterRowCount,
                prevPageCallback:this.prevPageCallback,
                nextPageCallback:this.nextPageCallback,
                currentPage:this.state.page,
                maxPage:maxPage}));
    },
    /**
     * Converts a value to it's object equivalent as defined by it's key.
     * For example key = id.id, the object value = {id:[value]}.
     *
     * @param key the key
     * @param val the value to convert to an object value
     */
    toObjValue:function(key, val) {
        var arr = key.split(".");
        if (arr.length > 1) {
            var valObj = {};
            valObj[arr[1]] = val;
            return valObj;
        }
        return val;
    },
    setSortKeyCallback: function(key) {
        var sortOrder = this.state.sortOrderMap === null ? null : this.state.sortOrderMap[key];
        var sortOrderMap;
        if (sortOrder === null) {
            sortOrderMap = {};
            sortOrderMap[key] = "asc";
        } else {
            sortOrderMap = this.state.sortOrderMap;
            sortOrderMap[key] = sortOrder === "asc" ? "desc" : "asc";
        }
        this.setState({sortKey:key, sortOrderMap:sortOrderMap});
    },
    filterCallback: function(val) {
        this.setState({filterVal:val, page:1});
    },
    selectNumberOfRowsToDisplayCallback: function(numberOfRowsToDisplayDropDownRef) {
        this.setState({numberOfRowsToDisplay:$(numberOfRowsToDisplayDropDownRef.getDOMNode()).val(), page:1});
    },
    prevPageCallback: function() {
        if (this.state.page > 1) {
            this.setState({page:this.state.page - 1});
        }
    },
    nextPageCallback: function(maxPage) {
        if (this.state.page < maxPage) {
            this.setState({page:this.state.page + 1});
        }
    },
    selectItemCallback: function(item) {
        this.props.selectItemCallback(item);
        this.setState({selectedRowIdx:item.rowIdx});
    },
    statics: {
        /**
         * Gets the "end" data as specified by item.key e.g. if item.key = "person.lastName", end data is the lastName.
         * This works for 2 levels only as of Nov 2014 for example "status.path".
         */
        getEndData: function(rowItem, itemKey) {
            var keys = itemKey.split(".");
            if (keys.length > 1) {
                return rowItem[keys[0]][keys[1]];
            }
            return rowItem[itemKey];
        }
    }
});

/**
 * The header component of the data table.
 *
 * Properties:
 *
 * 1. numberOfRowsToDisplay - the number of rows to display.
 */
var RDataTableHeader = React.createClass({
    render: function() {
        var self = this;
        var numberOfRowsToDisplayArray = ["25", "50", "100", "200", "ALL"];

        var optionsArray = [];
        numberOfRowsToDisplayArray.forEach(function(numberOfRowsToDisplay) {
            optionsArray.push(new React.DOM.option({value:numberOfRowsToDisplay},
                numberOfRowsToDisplay));
        });

        return React.DOM.div({className:"fg-toolbar ui-toolbar ui-widget-header ui-corner-tl ui-corner-tr ui-helper-clearfix"},
            React.DOM.div({className:"dataTables_length"},
                React.DOM.label(null, "Show ",
                    React.DOM.select({ref:"numberOfRowsToDisplayDropDown",
                            size:"1",
                            onChange:this.handleNumberOfRowsToDisplayChange,
                            defaultValue:self.props.numberOfRowsToDisplay},
                        optionsArray),
                    " entries")

            ),
            React.DOM.div({className:"dataTables_filter"},
                React.DOM.label(null, "Search: ",
                    React.DOM.input({ref:"filterTextBox",
                        onChange:this.handleChange}))
            )
        );
    },
    handleChange: function(e) {
        this.props.filterCallback(e.target.value);
    },
    handleNumberOfRowsToDisplayChange: function() {
        this.props.selectNumberOfRowsToDisplayCallback(this.refs.numberOfRowsToDisplayDropDown);
    }
});

/**
 * The footer component of the table.
 *
 * Properties:
 *
 * 1. numberOfRowsToDisplay
 * 2. rowCount
 * 3. filterRowCount
 * 4. prevPageCallback
 * 5. nextPageCallback
 * 6. currentPage
 * 7. maxPage
 */
var RDataTableFooter = React.createClass({
    render: function() {
        var countDetailStr;
        var displayedRowCount;
        if (this.props.filterRowCount === this.props.rowCount) {
            displayedRowCount = (this.props.numberOfRowsToDisplay < this.props.rowCount) ? this.props.numberOfRowsToDisplay : this.props.rowCount;
            countDetailStr = "Showing 1 to " + displayedRowCount + " of " + this.props.rowCount;
        } else {
            displayedRowCount = (this.props.numberOfRowsToDisplay < this.props.filterRowCount) ? this.props.numberOfRowsToDisplay : this.props.filterRowCount;
            countDetailStr = "Showing 1 to " + displayedRowCount + " of " + this.props.filterRowCount + " (filtered from " + this.props.rowCount + " total entries)";
        }

        var prevClass = "";
        var nextClass = "";

        if (this.props.maxPage === 1) {
            prevClass = "ui-state-disabled";
            nextClass = "ui-state-disabled";
        } else {
            if (this.props.currentPage === 1) {
                prevClass = "ui-state-disabled";
            } else if (this.props.currentPage === this.props.maxPage) {
                nextClass = "ui-state-disabled";
            }
        }

        return React.DOM.div({className:"fg-toolbar ui-toolbar ui-widget-header ui-corner-bl ui-corner-br ui-helper-clearfix"},
            React.DOM.div({className:"dataTables_info"}, countDetailStr),
            React.DOM.div({className:"dataTables_paginate fg-buttonset ui-buttonset fg-buttonset-multi ui-buttonset-multi paging_toc"},
                React.DOM.a({ref:"prevPage", className:"fg-button ui-button ui-state-default ui-corner-left " + prevClass, onClick:this.handlePrevPageClick},
                    React.DOM.span({className:"ui-icon ui-icon-circle-arrow-w"}, "")),
                React.DOM.a({ref:"nextPage", className:"fg-button ui-button ui-state-default ui-corner-right " + nextClass, onClick:this.handleNextPageClick},
                    React.DOM.span({className:"ui-icon ui-icon-circle-arrow-e"}, "")),
                React.DOM.span({style:{paddingLeft:"10px"}}, "Page " + this.props.currentPage + "/" + this.props.maxPage)
            ));
    },
    handlePrevPageClick: function() {
        this.props.prevPageCallback();
    },
    handleNextPageClick: function() {
        this.props.nextPageCallback(this.props.maxPage);
    }
});

/**
 * Header row component of the table.
 *
 * Properties:
 *
 * 1. colDefinitions - column definitions.
 * 2. setSortKeyCallback - callback that is called when sorting for a column is activated. The callback facilitates in the saving of the "sort key".
 * 3. sortKey - the key that identifies which column is sorted.
 * 4. sortOrderMap - contains information on the sort order e.g. ascending and descending.
 */
var RDataTableHeaderRow = React.createClass({
    render: function() {
        var headerCols = [];
        var self = this;
        this.props.colDefinitions.forEach(function(col) {
            if (col.type === undefined && col.isVisible !== false) {

                var sortIconClass = "ui-icon-carat-2-n-s";
                if (col.key === self.props.sortKey && self.props.sortOrderMap !== null) {
                    if (self.props.sortOrderMap[col.key] === "asc") {
                        sortIconClass = "ui-icon-triangle-1-n";
                    } else if (self.props.sortOrderMap[col.key] === "desc") {
                        sortIconClass = "ui-icon-triangle-1-s";
                    }
                }

                headerCols.push(new RDataTableHeaderColumn({ref:col.key,
                                                            colKey:col.key,
                                                            title:col.title,
                                                            sortable:col.sortable,
                                                            setSortKeyCallback:self.props.setSortKeyCallback,
                                                            sortIconClass:sortIconClass}));
            }
        });

        return React.DOM.thead(null, React.DOM.tr({role:"row"}, headerCols));
    }
});

/**
 * The column component.
 *
 * Properties:
 *
 * 1. key - the sort key.
 * 2. title - the title of the column.
 * 3. setSortKeyCallback - the callback called when sorting is set when user clicks on the column.
 * 4. sortIconClass - the class that determines what sort icon is displayed e.g. ascending icon or descending icon.
 * 5. sortable - indicates if the column is to be rendered with sorting feature or not
 */
var RDataTableHeaderColumn = React.createClass({
    render: function() {
        if (this.props.sortable === false) {
            return React.DOM.th({className:"ui-state-default"},
                                React.DOM.span({className:"col-header-title"}, this.props.title));
        }
        return React.DOM.th({ref:"colHead", className:"sorting ui-state-default", onClick:this.sort},
                            React.DOM.div({className:""},
                                          React.DOM.span({className:"col-header-title"}, this.props.title),
                                          React.DOM.span({className:"DataTables_sort_icon css_right ui-icon ui-icon-carat-2-n-s col-header-sort-icon " + this.props.sortIconClass})));
    },
    sort: function() {
        this.props.setSortKeyCallback(this.props.colKey);
    }
});

/**
 * Row component of the table.
 *
 * Properties:
 *
 * 1. rowItem
 * 2. colDefinitions
 * 3. selectItemCallback
 * 4. selectRowIdx
 */
var RDataTableRow = React.createClass({
    render: function() {
        var self = this;
        var cols = [];
        this.props.colDefinitions.forEach(function(col) {
            if (col.type === undefined && col.isVisible !== false) {
                cols.push(new RDataTableColumn({data:RDataTable.getEndData(self.props.rowItem, col.key)}));
            }
        });

        var style = this.props.rowItem.isVisible ? {} : {display:"none"};
        var rowSelectedClass = "";
        if (this.props.rowItem.isVisible) {
            if (this.props.selectedRowIdx !== null && this.props.selectedRowIdx === this.props.rowItem.rowIdx) {
                rowSelectedClass = " row_selected";
            }
        }
        return React.DOM.tr({className:this.props.className + rowSelectedClass,
                style:style,
                onClick:this.handleOnClick},
            cols);
    },
    handleOnClick: function() {
        this.props.selectItemCallback(this.props.rowItem);
    }
});

/**
 * The row's column component.
 *
 * Properties:
 *
 * 1. data - the data to be displayed in the column.
 */
var RDataTableColumn = React.createClass({
    render: function() {
        return React.DOM.td(null, this.props.data);
    }
});
