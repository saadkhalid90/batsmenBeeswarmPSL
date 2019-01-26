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
      .duration(300)
      .delay((d,i)=> i * 5 * Math.random())
      .attr('r', 0)
      .style('opacity', 0);
  },
  filterInTransitionFunc = function(selection){
    return selection.transition()
      .duration(300)
      .delay((d,i)=> i * 5 * Math.random())
      .attr('r', (d)=>d.originalRadius)
      .style('opacity', 1);
  },
  getDataObjFunc = function(d){
    return  d;
  }
}={}){

  var filterModule = FilterModule();

  var filterSeq = new filterModule.FilterSequence();

  testFS = filterSeq;

  function addNumericFilter(min,max,ind){
    var filterFunc = (d)=>{
      var dataObj = getDataObjFunc(d);
      var val = parseFloat(dataObj[ind]);
      console.log(val);
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

    svg.selectAll(selectionString)
      .classed('c-filter-show', false)
      .transition()
      .duration(300)
      .delay((d,i)=> i * 5 * Math.random())
      .attr('r', (d)=>d.originalRadius)
      .style('opacity', 1);
  }

  function executeFilter(){

    //remove filter class
    /*svg.selectAll('.g-circles circle')
      .classed('c-filter-show', false);*/

    selection = filterSeq.execute(d3.selectAll(selectionString));

    //show all that were previosly filtered
    console.log(selection);

    selection.filter(function(){
        return !this.classList.contains('c-filter-show');
      })
      .call(filterInTransitionFunc)

    //set not filtered class
    svg.selectAll(selectionString)
      .classed('c-filter-show', false);

    selection.classed('c-filter-show', true);

    //remove all filtered
    svg.selectAll(selectionString + ':not(.c-filter-show)')
      .classed('c-filter-show', false)
      .call(filterOutTransitionFunc)

    return selection;
  }

  return {
    addNumericFilter : addNumericFilter,
    addOrdinalFilter : addOrdinalFilter,
    addCustomFilter : addCustomFilter,
    executeFilter : executeFilter,
    removeAllFilters : removeAllFilters,
    removeFilter : removeFilter
  };
}