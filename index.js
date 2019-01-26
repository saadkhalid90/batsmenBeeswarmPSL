
      // define svg and dimensions of chart
      const svg = d3.select("svg"),
          margin = {top: 40, right: 40, bottom: 40, left: 40},
          SVGWidth = svg.attr("width"),
          SVGHeight = svg.attr("height"),
          width = SVGWidth - margin.left - margin.right,
          height = SVGHeight - margin.top - margin.bottom;

      // function to get half century units from data
      // voronoi (logical) indicates if voronoi function has been applied to data
      function getHCUnits(d, voronoi) {
        let centuries = voronoi ? d.data.Centuries : d.Centuries;
        let halfCenturies = voronoi ? d.data.HalfCenturies : d.HalfCenturies;
        return halfCenturies + 2 * (centuries);
      }


      // defining all relevant scales

      // batting average across x
      let x = d3.scaleLinear()
          .range([0, width]);
      // radius mapped to strike rate
      let radScale = d3.scaleSqrt()
                      .range([5, 25])
      // stroke colored to team and sized proportional to radius
      let strokeScale = d3.scaleSqrt()
                      .range([1, 4])
      // an outline outside circle to denote half centuries
      let centuryScale = d3.scaleSqrt()
                      .range([0, 4])
      // categorical scale for team colors
      let colScale = d3.scaleOrdinal()
                        .domain(['Peshawar Zalmi', 'Islamabad United', 'Quetta Gladiators', 'Lahore Qalandars', 'Karachi Kings', 'Multan Sultans'])
                        .range(['#FFEB3B','#EF6C00', '#512DA8','#B71C1C', '#9C27B0', '#43A047']);

      function drawBeeswarm(data){
          const g = svg.append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          const defs = svg.selectAll("defs")
            .data(data)
            .enter()
            .append("defs")

          defs.append("pattern")
            .attr('id', d => d.id)
            .attr('height', '100%')
            .attr('width', '100%')
            .attr("patternContentUnits", "objectBoundingBox")
            .append("image")
            .attr('height', 1)
            .attr('width', 1)
            .attr('preserveAspectRatio', 'none')
            .attr("xlink:href", d => d.photoLink);

          x.domain(d3.extent(data, function(d) { return +d.Avg; }));
          radScale.domain(d3.extent(data, function(d) { return +d.SR; }));
          strokeScale.domain(d3.extent(data, function(d) { return +d.SR; }));
          centuryScale.domain(d3.extent(data, function(d) { return getHCUnits(d, false); }))

          let simulation = d3.forceSimulation(data)
              .force("x", d3.forceX(function(d) { return x(+d.Avg); }).strength(5))
              .force("y", d3.forceY(height / 2))
              .force("collision", d3.forceCollide().radius(d => radScale(d.SR) + strokeScale(d.SR) /*+ centuryScale(getHCUnits(d, false))*/))
              .stop();

          // complete force simulation to get to equilibrium
          for (var i = 0; i < 500; ++i) simulation.tick();

          g.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x).tickValues(d3.range(0, 50, 5)))

          g.select(".axis.axis--x")
            .append('text')
            .attr('class', 'label axis --x')
            .text('Batting Average')
            .style('text-anchor', 'start')
            .style('fill', 'black')
            .attr('transform', 'translate(0, 12)');



          const xGridlines = d3.axisBottom()
                              .scale(x)
                              .tickSize(height)
                              .tickFormat("")

          g.append("g")
            .attr("class", "gridlines axis--x")
            .call(xGridlines);

          d3.selectAll('g.axis.axis--x g text')
            .attr('transform', 'translate(10, -18)')


          data = data.filter(d => !isNaN(d.Avg))


          let voronoi = d3.voronoi()
                          .extent([[-margin.left,  -margin.top], [width + margin.right, height + margin.top]])
                          .x(function(d) { return d.x; })
                          .y(function(d) { return d.y; })

          let cell = g.append("g")
              .attr("class", "cells")
              .selectAll("g")
              .data(voronoi.polygons(data))
              .enter()
              .append("g");

          cell.append("circle")
              .attr('class', 'centuries')
              .attr("r", d => radScale(d.data.SR) + (strokeScale(d.data.SR)/2) + centuryScale(getHCUnits(d, true)))
              .attr("cx", function(d) { return d.data.x; })
              .attr("cy", function(d) { return d.data.y; })
              //.style('fill', d => colScale(d.data.Team))
              .style("fill", 'grey')
              .style("fill-opacity", 0.2)
              .style('stroke', 'black')
              .style("stroke-width", d => {
                if (d.data.Centuries > 0 || d.data.HalfCenturies > 0){
                  return .5
                }
                else {
                  return 0
                }
              })
              .style('stroke-opacity', 0.6)

          cell.append("circle")
              .attr('class', 'team-strikeRate')
              .attr("r", d => radScale(d.data.SR))
              .attr("cx", function(d) { return d.data.x; })
              .attr("cy", function(d) { return d.data.y; })
              //.style('fill', d => colScale(d.data.Team))
              .style("fill", d => `url(#${d.data.id})`)
              .style('stroke', d => colScale(d.data.Team))
              .style("stroke-width", d => strokeScale(d.data.SR) + "px")


          /*cell.append("path")
              .attr("d", function(d) { return "M" + d.join("L") + "Z"; });*/

          cell.on('mouseover', function(d){
            var player = d.data.Name;
            var role = d.data.TypeA;
            var imgLink = d.data.photoLink;
            var playerAvg = d.data.Avg;
            var playerSR = d.data.SR;
            var matches = d.data.Matches;
            var halfcenturies = parseInt(d.data.HalfCenturies) + parseInt(d.data.Centuries * 2);

            var team = d.data.Team;

            //console.log(team);
            d3.select('body').append('div')
              .classed('animated', true)
              .classed('fadeInOpac', true)
              .classed('tool', true)
              .attr('id', 'hoverbox')
            // tooltip selection
            var tooltip = d3.select('.tool');

            tooltip.append('div')
              .classed('colorToolBar', true)
              .style('background-color', colScale(d.data.Team))

            tooltip.append('div')
              .classed('playerInfo', true)

            var playerHead = d3.select('.playerInfo');

            playerHead.append('div')
              .classed('playerName', true)
              .html(function(d) {
                return '<p style="margin-bottom: 5px; margin-top: 1px;">' + player + '</p><p class="playerRole">Role: <span class="bold">' + role + '</span></p>'
              })

            playerHead.append('div')
              .classed('playerAvatar', true)
              .html(function(d) {
                return '<img class="avatar" src="' + imgLink + '"></img>'
              })

            tooltip.append('div')
              .classed('match', true)
              .classed('flexDistance', true);

            var avg = d3.select('.match');

            avg.append('div')
              .classed('title', true)
              .html(function(d) {
                return '<p class="noMargin">Matches Played:</p>'
              })

            avg.append('div')
              .classed('value', true)
              .html(function(d) {
                return '<p class="noMargin">' + matches + '</p>'
              })

            tooltip.append('div')
              .classed('average', true)
              .classed('flexDistance', true);

            var avg = d3.select('.average');

            avg.append('div')
              .classed('title', true)
              .html(function(d) {
                return '<p class="noMargin">Average:</p>'
              })

            avg.append('div')
              .classed('value', true)
              .html(function(d) {
                return '<p class="noMargin">' + playerAvg + '</p>'
              })

            tooltip.append('div')
              .classed('SR', true)
              .classed('flexDistance', true);

            var avg = d3.select('.SR');

            avg.append('div')
              .classed('title', true)
              .html(function(d) {
                return '<p class="noMargin">Strike Rate:</p>'
              })

            avg.append('div')
              .classed('value', true)
              .html(function(d) {
                return '<p class="noMargin">' + playerSR + '</p>'
              })

            tooltip.append('div')
              .classed('HC', true)
              .classed('flexDistance', true);

            var avg = d3.select('.HC');

            avg.append('div')
              .classed('title', true)
              .html(function(d) {
                return '<p class="noMargin">Half Centuries:</p>'
              })

            avg.append('div')
              .classed('value', true)
              .html(function(d) {
                return '<p class="noMargin">' + halfcenturies + '</p>'
              })

            tooltip.append('div')
              .classed('banner_contain', true)
              .html(function(d) {
                if (team === "Islamabad United") {
                  return '<img class="banner" src="./teamBanner/islamabad.png"></img>'
                }
                else if (team === "Karachi Kings") {
                  return '<img class="banner" src="./teamBanner/karachi.png"></img>'
                }
                else if (team === "Quetta Gladiators") {
                  return '<img class="banner" src="./teamBanner/quetta.png"></img>'
                }
                else if (team === "Lahore Qalandars") {
                  return '<img class="banner" src="./teamBanner/lahore.png"></img>'
                }
                else if (team === "Peshawar Zalmi") {
                  return '<img class="banner" src="./teamBanner/peshawar.png"></img>'
                }
                else if (team === "Multan Sultans") {
                  return '<img class="banner" src="./teamBanner/multan.png"></img>'
                }
              })

              tooltip.style('top', d3.event.pageY - document.getElementById('hoverbox').getBoundingClientRect().height/2 + "px");
              if (d3.event.pageX < window.innerWidth/2) {
                tooltip.style('left', d3.event.pageX + 14 + "px");
              }
              else {
                tooltip.style('left', d3.event.pageX - 260 + "px");
              }

            //console.log(d.data)
          });

          cell.on('mouseout', function(d){
            d3.selectAll('.tool').remove();
          });


        /*  cell.append("title")
              .text(function(d) { console.log(d.data) }); return d.data.Name + "\n" + d.data.Avg + "\n" + d.data.SR; */
      }

      function preProcssData(data){
        data.forEach(d => {
          d.photoLink = `photos/${d.Name}.jpg`
          d.id = d.Name.replace(/ /g, "");
        })
      }

      function FilterModule(){
        class Filter {
          constructor(fn, name){
            this._fn = fn;
            this.name = name;
          }

          apply(selection){
            return selection.filter(this._fn);
          }
        }

        class FilterSequence{
          constructor(){
            this.filters = [];
          }

          add(filter){
            var index = this.filters.findIndex((d)=>d.name === filter.name);

            if(index > -1){
              this.filters[index] = filter;
            }else{
              this.filters.push(filter);
            }
          }

          remove(name){
            var index = this.filters.findIndex((d)=>d.name === name);
            if(index === -1){
              return;
            }
            this.filters.splice(index,1);
          }

          execute(selection){
            return this.filters.reduce(function(acc,d){
              return d.apply(acc);
            }, selection);
          }

          removeAll(){
            this.filters = [];
          }
        }

        return {
          Filter : Filter,
          FilterSequence : FilterSequence
        };
      }

      function domFilterModule({
        selectionString,
        filterOutTransitionFunc = function(selection){
          return selection.transition()
            .duration(100)
            .delay((d,i)=> i * 5 * Math.random())
            .style('opacity', 0);
        },
        filterInTransitionFunc = function(selection){
          return selection.transition()
            .duration(100)
            .delay((d,i)=> i * 2 * Math.random())
            .style('opacity', 1);
        },
        getDataObjFunc = function(d){
          return  d;
        }
      }={}){

        d3.selectAll(selectionString).style('pointer-events', 'visible')

        var filterModule = FilterModule();

        var filterSeq = new filterModule.FilterSequence();

        testFS = filterSeq;

        function addNumericFilter(min,max,ind){
          var filterFunc = (d)=>{
            var dataObj = getDataObjFunc(d);
            var val = parseFloat(dataObj[ind]);
            return val >= min && val <= max;
          };

          var filter = new filterModule.Filter(filterFunc, ind);
          filterSeq.add(filter);
        }

        function addOrdinalFilter(matches,ind){
          var filterFunc = (d)=>{
            var dataObj = getDataObjFunc(d);
            var val = dataObj[ind];
            return matches[val];
          };

          var filter = new filterModule.Filter(filterFunc, ind);
          filterSeq.add(filter);
        }

        function addCustomFilter(filterFunc,ind){
          var filter = new filterModule.Filter(filterFunc, ind);
          filterSeq.add(filter);
        }

        function removeFilter(name){
          filterSeq.remove(name);
        }

        function removeAllFilters(){
          filterSeq.removeAll();

          /*svg.selectAll(selectionString)
            .classed('c-filter-show', false)
            .transition()
            .duration(300)
            .delay((d,i)=> i * 5 * Math.random())
            .attr('r', (d)=>d.originalRadius)
            .style('opacity', 1)*/
        }

        function executeFilter(){

          //remove filter class
          /*svg.selectAll('.g-circles circle')
            .classed('c-filter-show', false);*/

          var filterSelection = d3.selectAll(selectionString)
          var selection = filterSeq.execute(filterSelection);

          //show all that were previosly filtered
          //console.log(selection);

          var filterIn = selection
            .filter(function(){
              return !this.classList.contains('c-filter-show');
            })
            .style('visibility','visible')
            //.style('display','unset');
            //.call(filterInTransitionFunc)

          filterInTransitionFunc(filterIn)
            /*.on('end', function(){

            })*/

          //set not filtered class
          filterSelection
            .classed('c-filter-show', false);

          selection.classed('c-filter-show', true);

          //remove all filtered
          var filterOut = svg.selectAll(selectionString + ':not(.c-filter-show)')
            //.call(filterOutTransitionFunc)

          filterOutTransitionFunc(filterOut)
            .on('end', function(){
              this.style.visibility = 'hidden';
              //this.style.display = 'none';
            })

          return selection;
        }

        return {
          addNumericFilter : addNumericFilter,
          addOrdinalFilter : addOrdinalFilter,
          addCustomFilter : addCustomFilter,
          executeFilter : executeFilter,
          removeAllFilters : removeAllFilters,
          removeFilter : removeFilter
        }
      }

      var filterCTRL = domFilterModule({
        selectionString : 'svg g.cells>g',
        getDataObjFunc : function(d){
          return d.data;
        }
      });

      async function readAndDrawBeeswarm(){
        let data = await d3.csv('PSL_Batting.csv')
        tData = data;

        // add ids and photo links
        preProcssData(data);

        drawBeeswarm(data);

        $("#batting").ionRangeSlider({
          type: "double",
          grid: true,
          min: 0,
          max: 50,
          from: 0,
          to: 50,
          onChange : function(data){
            filterCTRL.addNumericFilter(data.from, data.to, 'Avg');
            filterCTRL.executeFilter();
          }
        });

        var maxSR = Math.ceil(d3.max(data, (d)=>parseFloat(d.SR)));

        $("#strike_rate").ionRangeSlider({
          type: "double",
          grid: true,
          min: 0,
          max: maxSR,
          from: 0,
          to: maxSR,
          onChange : function(data){
            filterCTRL.addNumericFilter(data.from, data.to, 'SR');
            filterCTRL.executeFilter();
          }
        });

        var maxInnings = Math.ceil(d3.max(data, (d)=>parseFloat(d.Inns)));

        $("#innings").ionRangeSlider({
          type: "double",
          grid: true,
          min: 0,
          max: maxInnings,
          from: 0,
          to: maxInnings,
          onChange : function(data){
            filterCTRL.addNumericFilter(data.from, data.to, 'Inns');
            filterCTRL.executeFilter();
          }
        });

        var maxHalfCenturies = Math.ceil(d3.max(data, (d)=>parseFloat(d.HalfCenturies)));

        $("#half_centuries").ionRangeSlider({
          type: "double",
          grid: true,
          min: 0,
          max: maxHalfCenturies,
          from: 0,
          to: maxHalfCenturies,
          onChange : function(data){
            filterCTRL.addNumericFilter(data.from, data.to, 'HalfCenturies');
            filterCTRL.executeFilter();
          }
        });

        initSelectize('#team-selector', getTeams(tData), function(e){
          var val = e.target.value;
          if(val === 'All'){
            filterCTRL.removeFilter('Team');
          }else{
            var matches = {};
            matches[val] = true;
            filterCTRL.addOrdinalFilter(matches, 'Team');
          }
          filterCTRL.executeFilter();
        });

        initRadioButtons();
      }

      function getTeams(data){
        var teams = {};

        data.forEach(function(d){
          teams[d.Team] = true;
        });

        return Object.keys(teams).map((d)=>{return {name : d, text : d, value : d}});
      }

      readAndDrawBeeswarm();

      /*$("#batting").ionRangeSlider({
        type: "double",
        grid: true,
        min: 0,
        max: 50,
        from: 0,
        to: 50,
        onChange : function(data){
          filterCTRL.addNumericFilter(data.from, data.to, 'Avg');
          filterCTRL.executeFilter();
        }
      });

      $("#batting").ionRangeSlider({
        type: "double",
        grid: true,
        min: 0,
        max: 50,
        from: 0,
        to: 50,
        onChange : function(data){
          filterCTRL.addNumericFilter(data.from, data.to, 'Avg');
          filterCTRL.executeFilter();
        }
      });*/

      function initSelectize(selector,options, cb){

        var el = $(selector);

        options.push({name : 'All', text : 'All', value : 'All'});
        el.selectize({
          sortField : 'text',
          options : options
        });

        el[0].selectize.setValue('All', true);

        el.on('change', function(e){

          var selected = e.target.value;

          if(!selected){
            return;
          }
          cb(e);
        });
      }


      function initRadioButtons(){
        $('input[type="radio"][name="type"]').on('click', function(e){
          var val = e.target.value;

          if(val === 'All'){
            filterCTRL.removeFilter('TypeA');
          }else{
            var matches = {};
            matches[val] = true;
            filterCTRL.addOrdinalFilter(matches, 'TypeA');
          }

          filterCTRL.executeFilter();
        })
      }
