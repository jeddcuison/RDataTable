describe("RDataTable test suite", function() {

    var colDef = [{title:"Area Name", key:"areaName"},
        {title:"Property Type", key:"propertyType"},
        {title:"Property Name", key:"propertyName"},
        {title:"Address", key:"addr"},
        {title:"Zip Code", key:"zip"},
        {title:"Phone Number", key:"phone"},
        {title:"Management Company", key:"mgmtCompany"},
        {title:"Units", key:"units"}];

    var testUtils = React.addons.TestUtils;
    var dataTable;
    var dtInstance;

    var getNonVisibleRowCount = function(tableNode) {
        return $(tableNode).find("tbody > tr").filter(function() {
            return $(this).css("display") == "none";
        }).length;
    };

    beforeEach(function() {
        // Always start with a clean slate to avoid testing on stale data
        dataTable =  React.createElement(RDataTable, {colDefinitions:colDef, data:testJsonData});
        dtInstance = testUtils.renderIntoDocument(dataTable);
    });

    it("Can initialize component", function() {
        expect(dataTable.props.colDefinitions.length).toBe(8);
    });

    it("Can return no rows when filter value is not found in the data", function() {
        expect(getNonVisibleRowCount(dtInstance.refs.table.getDOMNode())).toBe(0);
        testUtils.Simulate.change(dtInstance.refs.tableHeader.refs.filterTextBox.getDOMNode(), {target: {value: "xxxxxxxxx"}});
        expect(getNonVisibleRowCount(dtInstance.refs.table.getDOMNode())).toBe(25);
    });

    it("Can filter a specific row", function() {
        expect(getNonVisibleRowCount(dtInstance.refs.table.getDOMNode())).toBe(0);
        testUtils.Simulate.change(dtInstance.refs.tableHeader.refs.filterTextBox.getDOMNode(), {target: {value: "5565-71 W. Quincy Ave."}});
        expect(getNonVisibleRowCount(dtInstance.refs.table.getDOMNode())).toBe(24);
        expect($(dtInstance.refs.table.getDOMNode()).find("tbody > tr:contains('5565-71 W. Quincy Ave.')").attr("Style")).toBe(undefined);
    });

    it("Can go to next and previous pages", function() {
        dtInstance.setState({numberOfRowsToDisplay: 5});
        expect(getNonVisibleRowCount(dtInstance.refs.table.getDOMNode())).toBe(20);

        var rows = $(dtInstance.refs.table.getDOMNode()).find("tbody > tr");
        for (var i = 0; i < rows.length; i++) {
            if (i < 5) {
                expect($(rows[i]).attr("Style")).toBe(undefined);
            } else {
                expect($(rows[i]).attr("Style")).toBe("display: none;");
            }
        }

        testUtils.Simulate.click(dtInstance.refs.tableFooter.refs.nextPage.getDOMNode());
        for (i = 0; i < rows.length; i++) {
            if ((i >= 5) && (i < 10)) {
                expect($(rows[i]).attr("Style")).toBe(undefined);
            } else {
                expect($(rows[i]).attr("Style")).toBe("display: none;");
            }
        }

        testUtils.Simulate.click(dtInstance.refs.tableFooter.refs.prevPage.getDOMNode());
        for (i = 0; i < rows.length; i++) {
            if (i < 5) {
                expect($(rows[i]).attr("Style")).toBe(undefined);
            } else {
                expect($(rows[i]).attr("Style")).toBe("display: none;");
            }
        }
    });

    it("Can sort a column", function() {
        var getColVal = function(row) {
            return $($(row).find("td")[6]).html();
        };

        var rows = $(dtInstance.refs.table.getDOMNode()).find("tbody > tr");
        expect(getColVal(rows[0])).toBe("Metroplex, Inc.");

        testUtils.Simulate.click(dtInstance.refs.tableColHeader.refs.mgmtCompany.refs.colHead.getDOMNode());
        for (var i = 0; i < rows.length; i++) {
            expect(getColVal(rows[i])).toBe(sortedTestDataCompanyName[i]);
        }
    });

});