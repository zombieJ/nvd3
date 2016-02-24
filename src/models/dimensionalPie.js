nv.models.dimensionalPie = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------
    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , getX = function(d) { return d.x }
        , getY = function(d) { return d.y }
        , container = null
        , color = nv.utils.defaultColor()
        , valueFormat = d3.format(',.2f')
        , duration = 250
        , labelType = null
        , dispatch = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout', 'elementMousemove', 'renderEnd')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------
    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();

        selection.each(function(data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , radius = Math.min(availableWidth, availableHeight) / 2
                ;

            container = d3.select(this);
            nv.utils.initSVG(container);
            radius = radius * 0.8;

            // Slides Calculation
            var arc = d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(0);
            var outerArc = d3.svg.arc()
                .outerRadius(radius * 0.6)
                .innerRadius(radius * 0.6);

            var _layout = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.disabled ? 0 : getY(d) });

            // Initialization
            var wrap = container.selectAll('.nvd3.nv-wrap.nv-dimensional-pie').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-dimensional-pie');
            wrapEnter.append('g').attr('class', 'nv-pie').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');
            wrapEnter.append('g').attr('class', 'nv-labels').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');

            // =================================================
            // =                     Graph                     =
            // =================================================
            // Enter
            var slides = wrap.select('.nv-pie').selectAll('.nv-slice').data(_layout);
            var slidesEnter = slides.enter().append('g').attr('class', 'nv-slice');
            slidesEnter.append('path')
                .attr('fill', function(d,i) { return color(d.data, i); })
                .attr('fill-opacity', '0')
                .attr('transform', 'scale(1e-6, 1e-6)')

                .on('mouseover', function(d,i) {
                    d3.select(this).transition().attr('fill-opacity', '1')
                    dispatch.elementMouseover({
                        data: data[i],
                        index: i,
                        color: d3.select(this).style("fill")
                    });
                })
                .on('mouseout', function(d,i) {
                    d3.select(this).transition().attr('fill-opacity', '0.7')
                    dispatch.elementMouseout({data: d, index: i});
                })
                .on('mousemove', function(d,i) {
                    dispatch.elementMousemove({data: d, index: i});
                })
            ;

            // Transition
            slides.transition().duration(duration)
                .select('path')
                .attrTween('d', function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                })
                .attr('fill-opacity', '0.7')
                .attr('transform', 'scale(1, 1)')
            ;

            // Exit
            var slidesExit = slides.exit().transition().remove();
            slidesExit.select('path')
                .attr('fill-opacity', '0')
                .attr('transform', 'scale(1e-6, 1e-6)');

            // =================================================
            // =                     Text                      =
            // =================================================
            var lables = wrap.select('.nv-labels').selectAll('.nv-label').data(_layout);
            var lablesEnter = lables.enter().append('g').attr('class', 'nv-label');
            lablesEnter.append('text');

            // Enter
            lablesEnter
                .attr('fill-opacity', '0')
                .attr('transform', 'scale(1e-6, 1e-6)')
                ;

            // Transition
            lables.transition().duration(duration)
                .attr('fill-opacity', function(d) {
                    return d.endAngle-d.startAngle > 0.3 ? '1' : '0';
                })
                .attr('transform', 'scale(1, 1)')
                .select('text')
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        return "translate("+ pos +")";
                    };
                })
                .text(function(d, i) {
                    if(d.endAngle-d.startAngle > 0.3) {
                        switch (labelType) {
                            case 'key':
                                return data[i].name;
                            case 'value':
                                return Number(d.value).toFixed(1);
                            default:
                                return Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%';
                        }
                    } else {
                        return '';
                    }
                })
            ;

            // Exit
            lables.exit().transition()
                .attr('fill-opacity', '0')
                .attr('transform', 'scale(1e-6, 1e-6)')
                .remove();
        });

        renderWatch.renderEnd('pie immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        x:              {get: function(){return getX;}, set: function(_){getX=_;}},
        y:              {get: function(){return getY;}, set: function(_){getY=d3.functor(_);}},
        width:          {get: function(){return width;}, set: function(_){width=_;}},
        height:         {get: function(){return height;}, set: function(_){height=_;}},
        labelType:      {get: function(){return labelType;}, set: function(_){labelType= _ || 'percent';}},
        valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
        duration:       {get: function(){return duration;}, set: function(_){
            duration = _;
            renderWatch.reset(duration);
        }}
    });

    nv.utils.initOptions(chart);
    return chart;
};