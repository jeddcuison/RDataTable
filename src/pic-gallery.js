/**
 * A simple picture viewer used by RDataTable for expand/collapse row demo purposes.
 */
var PicGallery = React.createClass({

    render: function() {

        var sizeStr = "200x200";
        var picLink =  ["https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=0&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=45&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=90&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=135&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=180&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=225&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=270&pitch=10",
                        "https://maps.googleapis.com/maps/api/streetview?size=" + sizeStr + "&location=" + this.props.lat +  "," + this.props.lon + "&fov=90&heading=315&pitch=10"];

        var pics = [];
        picLink.forEach(function (picLink) {
            pics.push(React.createElement("img", {src:picLink}));
            pics.push(" ");
        });


        return React.createElement("div",
                                   null,
                                   React.createElement("p", null, this.props.title),
                                   pics);
    }

});