var Periodicity = function(configs, parentPeriod) {
    if (typeof(parentPeriod) !== 'undefined' && parentPeriod !== null) {
        this.parentPeriod = parentPeriod;
    } else {
        this.parentPeriod = null;
    }
    
    var config = configs.shift();
    var bits = 36;
    var len = 32;
    var outStr = "",
    newStr;
    while (outStr.length < len) {
        newStr = Math.random().toString(bits).slice(2);
        outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
    }
    this.id = outStr.toUpperCase();
    this.name = config.name;
    this.title = config.title;
    this.start = config.start;
    this.end = config.end;
    this.selectedPeriod = this.end;
    this.crossYear = false;
    this.offset = (config.hasOwnProperty('offset')) ? config.offset : 0;
    this.daysPerPeriod = (config.hasOwnProperty('daysPerPeriod')) ? config.daysPerPeriod : null;
    this.labelVariable = config.labelVariable;
    this.secondLabelVariable = (config.hasOwnProperty('secondLabelVariable')) ? config.secondLabelVariable : null;
    this.eventsSuspended = false;
    this.type = config.type;
	this.firstDay = config.firstDay ? config.firstDay : null;
	this.getFirstDay = config.getFirstDay ? new config.getFirstDay(this) : null; 
    
    this.events = {
        'selectionChange': [],
        'optionsChange': []
    };
    
    if (config.hasOwnProperty('startSeason') && config.hasOwnProperty('endSeason')) {
        if (config.startSeason > config.endSeason) {
            this.crossYear = true;
        }
        this.minPeriod = config.startSeason;
        this.maxPeriod = config.endSeason;
    } else {
        this.minPeriod = 1;
        this.maxPeriod = -1;
    }
    
    if (config.hasOwnProperty('periodsPerParent')) {
        if (typeof(config.periodsPerParent) === 'number') {
            this.periodsPerParent = new StaticPeriodsPerParent(this, config.periodsPerParent);
        } else {
            this.periodsPerParent = new config.periodsPerParent(this);
        }
    }
    
    if (config.hasOwnProperty('displayFormatter')) {
        this.displayFormatter = new config.displayFormatter(this);
    } else {
        this.displayFormatter = new DisplayFormatter(this);
    }
    
    if (config.hasOwnProperty('dateFormatter')) {
        this.dateFormatter = new config.dateFormatter(this);
    } else {
        this.dateFormatter = new DateFormatter(this);
    }
    
    if (config.hasOwnProperty('labelFormatter')) {
        this.labelFormatter = new config.labelFormatter(this);
    } else {
        this.labelFormatter = new LabelFormatter(this);
    }
    
    if (config.hasOwnProperty('digitCount')) {
        this.numberFormatter = new NumberFormatter(this, config.digitCount);
    } else {
        this.numberFormatter = new NumberFormatter(this);
    }
    
    if (configs.length > 0) {
        this.createChild(configs);
    } else {
        this.childPeriod = null;
    }
    
    if (this.parentPeriod === null) {
        this.setStartAndEndPeriods();
    }
}

Periodicity.prototype.setStartAndEndPeriods = function() {
    if (this.end === null) this.setEndPeriodByChild();
    if (this.start === null) this.setStartPeriodByChild();
    if (this.childPeriod !== null) this.childPeriod.setStartAndEndPeriods();
}

Periodicity.prototype.createChild = function(configs) {
    this.childPeriod = new Periodicity(configs, this);
}

Periodicity.prototype.suspendEvents = function() {
    this.eventsSuspended = true;
}

Periodicity.prototype.resumeEvents = function() {
    this.eventsSuspended = false;
}

Periodicity.prototype.callEvents = function(eventName, passedParams) {
    if (this.eventsSuspended === true) return;
    for (var i = 0; i < this.events[eventName].length; i++) {
        var callback = this.events[eventName][i];
        
        callback.callbackFunction(callback.callbackObj, passedParams);
    }
}

Periodicity.prototype.registerEvent = function(eventName, callbackObj, callbackFunction) {
    this.events[eventName].push({
        callbackObj: callbackObj,
        callbackFunction: callbackFunction,
    });
}

Periodicity.prototype.getPeriodsPerParent = function() {
    return this.periodsPerParent.getPeriodsPerParent();
}

Periodicity.prototype.formatDisplay = function() {
    return this.displayFormatter.formatDisplay();
}

Periodicity.prototype.formatLabel = function() {
    return this.formatNumber(this.labelFormatter.formatLabel());
}

Periodicity.prototype.formatDate = function() {
    return this.dateFormatter.formatDate();
}

Periodicity.prototype.formatNumber = function(number) {
    return this.numberFormatter.formatNumber(number);
}

Periodicity.prototype.formatValue = function() {
    return this.name + this.selectedPeriod;
}

Periodicity.prototype.hasNext = function(constrain, periodName) {
    if (typeof(constrain) === 'undefined') constrain = true;
    if (typeof(periodName) !== 'undefined' && this.name !== periodName) {
        if (this.childPeriod !== null) {
            return this.childPeriod.hasNext(constrain, periodName);
        } else {
            return false;
        }
    }
    
    if (constrain === true && this.parentsAtEnd() === true) {
        if (this.selectedPeriod !== this.end) {
            return true;
        }
    } else if (this.crossYear === true) {
        if ((this.selectedPeriod < this.maxPeriod && this.selectedPeriod >= 1) || (this.selectedPeriod >= this.minPeriod && this.selectedPeriod <= this.getPeriodsPerParent())) {
            return true;
        }
    } else if (this.maxPeriod !== -1) {
        if (this.selectedPeriod < this.maxPeriod) return true;
    } else {
        if (this.selectedPeriod < this.getPeriodsPerParent()) return true;
    }
    
    if (typeof(periodName) === 'undefined' && this.childPeriod !== null) {
        return this.childPeriod.hasNext(constrain);
    }
    
    return false;
}

Periodicity.prototype.hasPrev = function(constrain, periodName) {
    if (typeof(constrain) === 'undefined') constrain = true;
    if (typeof(periodName) !== 'undefined' && this.name !== periodName) {
        if (this.childPeriod !== null) {
            return this.childPeriod.hasPrev(constrain, periodName);
        } else {
            return false;
        }
    }
    
    if (constrain === true && this.parentsAtStart() === true) {
        if (this.selectedPeriod !== this.start) return true;
    } else if (this.crossYear === true) {
        if ((this.selectedPeriod > this.minPeriod && this.selectedPeriod <= this.getPeriodsPerParent()) || (this.selectedPeriod <= this.maxPeriod && this.selectedPeriod >= 1)) {
            return true;
        }
    } else {
        if (this.selectedPeriod > this.minPeriod) return true;
    }
    
    if (typeof(periodName) === 'undefined' && this.childPeriod !== null) {
        return this.childPeriod.hasPrev(constrain);
    }
    
    return false;
}

Periodicity.prototype.next = function(constrain, periodName) {
    if (typeof(constrain) === 'undefined') constrain = true;
    if (this.name !== periodName && this.childPeriod !== null) {
        if (this.childPeriod.hasNext(constrain, periodName) === true) {
            this.childPeriod.next(constrain, periodName);
        } else {
            if (this.crossYear === true && this.selectedPeriod === this.getPeriodsPerParent()) {
                this.selectedPeriod = 1;
            } else {
                this.selectedPeriod+=1;
            }
            
            this.childPeriod.selectFirst();
            this.callEvents('selectionChange', this.selectedPeriod);
        }
    } else {
        if (this.crossYear === true && this.selectedPeriod === this.getPeriodsPerParent()) {
            this.selectedPeriod = 1;
        } else {
            this.selectedPeriod+=1;
        }
        this.callEvents('selectionChange', this.selectedPeriod);
    }
}

Periodicity.prototype.prev = function(constrain, periodName) {
    if (typeof(constrain) === 'undefined') constrain = true;
    if (this.name !== periodName && this.childPeriod !== null) {
        if (this.childPeriod.hasPrev(constrain, periodName) === true) {
            this.childPeriod.prev(constrain, periodName);
        } else {
            if (this.crossYear === true && this.selectedPeriod === 1) {
                this.selectedPeriod = this.getPeriodsPerParent();
            } else {
                this.selectedPeriod-=1;
            }
            
            this.childPeriod.selectLast();
            this.callEvents('selectionChange', this.selectedPeriod);
        }
    } else {
        if (this.crossYear === true && this.selectedPeriod === 1) {
            this.selectedPeriod = this.getPeriodsPerParent();
        } else {
            this.selectedPeriod-=1;
        }
        this.callEvents('selectionChange', this.selectedPeriod);
    }
}

Periodicity.prototype.selectFirst = function() {
    
    this.callEvents('optionsChange', this.selectedPeriod);
    this.selectedPeriod = this.minPeriod;
    this.callEvents('selectionChange', this.selectedPeriod);
    
    if (this.childPeriod !== null) {
        this.childPeriod.selectFirst();
    }
}

Periodicity.prototype.selectLast = function() {
    
    this.callEvents('optionsChange', this.selectedPeriod);
    if (this.crossYear === true || this.maxPeriod !== -1) {
        this.selectedPeriod = this.maxPeriod;
    } else {
        this.selectedPeriod = this.getPeriodsPerParent();
    }
    this.callEvents('selectionChange', this.selectedPeriod);
    
    if (this.childPeriod !== null) {
        this.childPeriod.selectLast();
    }
}

Periodicity.prototype.parentsAtEnd = function() {
    if (this.parentPeriod !== null) {
        if (this.parentPeriod.parentsAtEnd() === true) {
            return (this.parentPeriod.selectedPeriod === this.parentPeriod.end);
        } else {
            return false;
        }
    }
    return true;
}

Periodicity.prototype.parentsAtStart = function() {
    if (this.parentPeriod !== null) {
        if (this.parentPeriod.parentsAtStart() === true) {
            return (this.parentPeriod.selectedPeriod === this.parentPeriod.start);
        } else {
            return false;
        }
    }
    return true;
}

/**
 * Gets all possible options for a period
 *
 * @param returnType specifies the format of the options.
 *     possible values:
 *         'text': returns the output of each options from the outputFormatter method
 *         'value': returns the raw value of each options
 *         undefined: returns both in an object
 */
Periodicity.prototype.getOptionsPerParent = function(returnType) {
    var allSelections = [];
    var savedSelection = this.selectedPeriod;
    var startCount = 0, endCount = 0, periodCount = 0;
    
    if (this.parentPeriod !== null && this.parentPeriod.hasNoSelection() === true) {
        return allSelections;  // Return empty array.
    }
    
    if (this.parentPeriod === null || this.parentsAtStart()) {
        this.selectedPeriod = this.start;
    } else {
        this.selectedPeriod = this.minPeriod;
    }
    
    if (this.maxPeriod !== -1) {
        startCount = this.minPeriod;
        endCount = this.maxPeriod;
        if (this.parentsAtStart() === true) {
            startCount = this.start;
        }
        if (this.parentsAtEnd() === true) {
            endCount = this.end;
        }
        
        if (startCount === endCount) {
            periodCount = 1;
        } else if (this.crossYear === true) {
            periodCount = this.getPeriodsPerParent() - startCount + endCount + 1;
        } else {
            periodCount = endCount - startCount + 1;
        }
    } else {
        startCount = 1;
        endCount = this.getPeriodsPerParent();
        if (this.parentsAtStart() === true) {
            startCount = this.start;
        }
        if (this.parentsAtEnd() === true) {
            endCount = this.end;
        }
        periodCount = endCount - startCount + 1;
    }
    
    for (var i = 0; i < periodCount; i+=1) {
        switch (returnType) {
            case 'text':
            allSelections.push(this.formatDisplay());
            break;
            case 'value':
                allSelections.push(this.selectedPeriod);
                break;
            default: 
                var obj = {
                    'value': this.selectedPeriod,
                    'text': this.formatDisplay()
                };
                
                allSelections.push(obj);
                break;
        }
        
        if (this.crossYear === true && this.selectedPeriod === this.getPeriodsPerParent()) {
            this.selectedPeriod = 1;
        } else {
            this.selectedPeriod += 1;
        }
    }
    
    this.selectedPeriod = savedSelection;
    
    return allSelections;
}

Periodicity.prototype.setToEnd = function() {
    this.selectedPeriod = this.end;
    
    this.callEvents('optionsChange', this.selectedPeriod);
    
    if (this.childPeriod !== null) {
        this.childPeriod.setToEnd();
    }
}

Periodicity.prototype.setToStart = function() {
    this.selectedPeriod = this.start;
    
    this.callEvents('optionsChange', this.selectedPeriod);
    
    if (this.childPeriod !== null) {
        this.childPeriod.setToStart();
    }
}

Periodicity.prototype.getSelection = function(array) {
    if (typeof(array) === 'undefined') array = [];
    array.push(this.selectedPeriod);
    if (this.childPeriod !== null) {
        return this.childPeriod.getSelection(array);
    }
    return array;
}

Periodicity.prototype.setSelection = function(array) {
    this.selectedPeriod = parseInt(array.shift());
    
    this.callEvents('optionsChange', this.selectedPeriod);
    
    if (this.childPeriod !== null) {
        this.childPeriod.setSelection(array);
    }
}

Periodicity.prototype.hasEmptySelection = function() {
    if (this.selectedPeriod === 0) return true;
    if (this.childPeriod !== null) return this.childPeriod.hasEmptySelection();
    return false;
}

Periodicity.prototype.hasNoSelection = function() {
    return (this.selectedPeriod === 0);
}

Periodicity.prototype.buildLabel = function(label) {
    if (this.childPeriod !== null) {
        label = this.childPeriod.buildLabel(label);
    }
    
    if (label.indexOf('{{'+this.labelVariable+'}}') !== -1) {
        if (this.parentPeriod !== null && label.indexOf('{{'+this.parentPeriod.labelVariable+'}}') === -1) {
            var savedSelection = this.selectedPeriod;
            var parent = this.getClosestParentInLabel(label);
            this.selectedPeriod = parent.getSelectedPeriodByPeriod(this.name, parent.name);
            label = label.replace('{{'+this.labelVariable+'}}', this.formatLabel());
            this.selectedPeriod = savedSelection;
        } else {
            label = label.replace('{{'+this.labelVariable+'}}', this.formatLabel());
        }
    }
    
    if (this.secondLabelVariable !== null && label.indexOf('{{'+this.secondLabelVariable+'}}') !== -1) {
        this.selectedPeriod-=1;
        label = label.replace('{{'+this.secondLabelVariable+'}}', this.formatLabel());
        this.selectedPeriod+=1;
    }
    
    return label;
}

Periodicity.prototype.buildDisplayLabel = function(label) {
    if (this.childPeriod !== null) {
        label = this.childPeriod.buildDisplayLabel(label);
    }
    
    if (label.indexOf('{{'+this.labelVariable+'}}') !== -1) {
        if (this.parentPeriod !== null && label.indexOf('{{'+this.parentPeriod.labelVariable+'}}') === -1) {
            var savedSelection = this.selectedPeriod;
            var parent = this.getClosestParentInLabel(label);
            this.selectedPeriod = parent.getSelectedPeriodByPeriod(this.name, parent.name);
            label = label.replace('{{'+this.labelVariable+'}}', this.formatDisplay());
            this.selectedPeriod = savedSelection;
        } else {
            label = label.replace('{{'+this.labelVariable+'}}', this.formatDisplay());
        }
    }
    
    if (this.secondLabelVariable !== null && label.indexOf('{{'+this.secondLabelVariable+'}}') !== -1) {
        this.selectedPeriod-=1;
        label = label.replace('{{'+this.secondLabelVariable+'}}', this.formatDisplay());
        this.selectedPeriod+=1;
    }
    
    return label;
}

Periodicity.prototype.getClosestParentInLabel = function(label) {
    if (this.parentPeriod !== null) {
        if (label.indexOf('{'+this.parentPeriod.labelVariable+'}') !== -1) {
            return this.parentPeriod;
        } else {
            return this.parentPeriod.getClosestParentInLabel(label);
        }
    }
    return null;
}

/**
 * Used internally by the getSelectedPeriodByPeriod function.
 */
Periodicity.prototype.getPeriodByPeriod = function(bottomPeriod, isLast) {
    if (this.name === bottomPeriod) {  // If this is bottom period we are looking for.
        return (isLast === false) ? this.getPeriodsPerParent() : this.selectedPeriod;  // If the parent period's loop is at it's currently selected period, get bottom periods selected period. Else get max number of periods.
    } else {  // If this is between the top and bottom periods.
        var savedSelection = this.selectedPeriod;  // Store current the selection.
        var lastPeriod = (isLast === false) ? this.getPeriodsPerParent() : savedSelection;
        var periods = 0;
        for (var i = 1; i <= lastPeriod; i++) {  // Loop through the options of this period from start to end.
            this.selectedPeriod = i;  // Set the selection for use in the child periods getPeriodsPerParent function.
            if (i === lastPeriod) {  // If we have reached the currently selected period.
                periods += this.childPeriod.getPeriodByPeriod(bottomPeriod, true);  // Call this function on the child period. Let it know we are at the end.
            } else {
                periods += this.childPeriod.getPeriodByPeriod(bottomPeriod, false);  // Call this function on the child period. Let it know we are not at the end.
            }
        }
        this.selectedPeriod = savedSelection;  // Restore the currently selected period.
        return periods;
    }
    return 0;
}

/**
 * Converts the selected period by a period further up in the hierarchy.
 *
 * e.g. Can convert {year: 2015, month: 2, dekad: 2} to {year: 2015, dekad: 8}
 */
Periodicity.prototype.getSelectedPeriodByPeriod = function(bottomPeriod, topPeriod) {
    if (this.childPeriod !== null) {
        if (this.name === topPeriod) {  // Top period found
            return this.childPeriod.getPeriodByPeriod(bottomPeriod, true);  // Call getPeriodByPeriod to recurse through child periods down to the specified bottom period.
        } else  {  // Not the top period
            return this.childPeriod.getSelectedPeriodByPeriod(bottomPeriod, topPeriod);  // Keep looking
        }
    }
    
    return null;
}

Periodicity.prototype.getChildPeriodByName = function(name) {
    if (this.name === name) return this;
    if (this.childPeriod !== null) return this.childPeriod.getChildPeriodByName(name);
    return null;
}

Periodicity.prototype.getParentPeriodByName = function(name) {
    if (this.name === name) return this;
    if (this.parentPeriod !== null) return this.parentPeriod.getParentPeriodByName(name);
    return null;
}

Periodicity.prototype.getTopPeriodObj = function() {
    if (this.parentPeriod !== null) return this.parentPeriod.getTopPeriodObj();
    return this;
}

Periodicity.prototype.getBottomPeriodObj = function() {
    if (this.childPeriod !== null) return this.childPeriod.getBottomPeriodObj();
    return this;
}

Periodicity.prototype.setEndPeriodByChild = function() {
    this.selectedPeriod = 1;
    while (this.childPeriod.getPeriodsPerParent() < this.childPeriod.selectedPeriod) {
        this.childPeriod.selectedPeriod -= this.childPeriod.getPeriodsPerParent();
        this.selectedPeriod+=1;
    }
    this.end = this.selectedPeriod;
    this.childPeriod.end = this.childPeriod.selectedPeriod;
}

Periodicity.prototype.setStartPeriodByChild = function() {
    this.selectedPeriod = 1;
    while (this.childPeriod.getPeriodsPerParent() < this.childPeriod.start) {
        this.childPeriod.start -= this.childPeriod.getPeriodsPerParent();
        this.selectedPeriod+=1;
    }
    this.start = this.selectedPeriod;
    this.selectedPeriod = this.end;
}

Periodicity.prototype.atEndOfSeason = function() {
    if (this.childPeriod !== null) {
        if (this.maxPeriod === -1) {
            return this.childPeriod.atEndOfSeason();
        }
        if (this.childPeriod.atEndOfSeason() === false) {
            return false;
        }
    }
    return (this.selectedPeriod === this.maxPeriod);
}

Periodicity.prototype.atStartOfSeason = function() {
    if (this.childPeriod !== null) {
        if (this.minPeriod === 1) {
            return this.childPeriod.atStartOfSeason();
        }
        if (this.childPeriod.atStartOfSeason() === false) {
            return false;
        }
    }
    return (this.selectedPeriod === this.minPeriod);
}

Periodicity.prototype.childrenInNextYear = function() {
    if (this.childPeriod !== null) {
        if (this.childPeriod.crossYear === true && this.childPeriod.selectedPeriod <= this.childPeriod.maxPeriod) {
            return true;
        }
        return this.childPeriod.childrenInNextYear();
    }
    return false;
}

Periodicity.prototype.isCrossYear = function() {
    if (this.crossYear === false) {
        if (this.childPeriod !== null) {
            return this.childPeriod.isCrossYear();
        }
        return false;
    }
    return true;
}

Periodicity.prototype.hasMultiplePeriods = function() {
    if (this.start !== this.end) return true;
    if (this.childPeriod !== null) {
        return this.childPeriod.hasMultiplePeriods();
    }
    return false;
}

Periodicity.prototype.isOutOfRange = function() {
    return ((this.parentsAtEnd() && this.selectedPeriod > this.end) || (this.parentsAtStart() && this.selectedPeriod < this.start));
}

Periodicity.prototype.syncSelection = function(periodicity) {
    var savedSelection = this.selectedPeriod;
    var newPeriodValue = periodicity.formatValue();
    var periodsPerParent = this.getPeriodsPerParent();
    var foundPeriod = false;
    
    for (var i = 1; i <= periodsPerParent; i+=1) {
        this.selectedPeriod = i;
        if (this.parentPeriod !== null && this.isOutOfRange()) continue;
        if (this.formatValue() === newPeriodValue) {
            if (this.childPeriod !== null && periodicity.childPeriod !== null) {
                this.childPeriod.syncSelection(periodicity.childPeriod);
                return;
            }
            foundPeriod = true;
            break;
        }
    }
    if (foundPeriod === false) this.selectedPeriod = savedSelection;
}

/**
 * Checks to see if this period and all parents of this period is at the end.
 */
Periodicity.prototype.atEnd = function() {
    if (this.parentPeriod === null) {  // If this is the top period
        return (this.selectedPeriod === (this.end - this.start + 1));  // Do the top-period-specific check for the end
    } else if (this.parentsAtEnd()) {  // If all parents are at the end
        return (this.selectedPeriod === this.end);  // Check if this period is at the end
    } else {  // At least one parent is not at the end
        return (this.selectedPeriod === this.getPeriodsPerParent());  // Check if this period is equal to the max allowed period for it's parent period
    }
}

/**
 * Checks to see if this period and all parents of this period is at the start.
 */
Periodicity.prototype.atStart = function() {
    if (this.parentPeriod === null) {  // If this is the top period
        return (this.selectedPeriod === 1);  // Top periods start is always 1
    } else if (this.parentsAtStart()) {  // If all parents are at the start
        return (this.selectedPeriod === this.start);  // Check if this period is at the start
    } else {  // At least one parent is not at the start
        return (this.selectedPeriod === 1);  // Check if this period is equal to the lowest allowed period for it's parent period (always 1)
    }
}

/**
 * Set the selection on a specific period. 
 *
 * Executes selectionChange event on this period and optionsChange event on all child periods.
 */
Periodicity.prototype.setSelectedPeriod = function(selection, suppressEvents) {
    this.selectedPeriod = selection;
    //if (suppressEvents !== true) this.callEvents('selectionChange', {value:this.selectedPeriod,text:this.outputFormatter()});
    
    if (this.childPeriod !== null) {
        if (suppressEvents !== true) this.childPeriod.callEvents('optionsChange', this.childPeriod.getOptionsPerParent());
        
        this.childPeriod.setSelectedPeriod(this.childPeriod.selectedPeriod);
    } 
}

Periodicity.prototype.getSelectedIndex = function() {
    var index = 0,
    selectedPeriod = this.selectedPeriod,
    optionsPerParent = this.getOptionsPerParent('value');
    
    for (var i = 0, len = optionsPerParent.length; i < len; i+=1) {
        var option = optionsPerParent[i];
        if (option == selectedPeriod) {
            return i;
        } 
    }
}

/**
 * Display formatters.
 *
 * These objects convert the selected period into the format seen by the user.
 */

var DisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

DisplayFormatter.prototype.formatDisplay = function() {
    return this.periodObj.labelFormatter.formatLabel();
}

var MonthDisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

MonthDisplayFormatter.prototype.formatDisplay = function() {
    var months = mapper.periodsConfig[this.periodObj.type].months;
    return months[this.periodObj.selectedPeriod - 1];
}

var YearDisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

YearDisplayFormatter.prototype.formatDisplay = function() {
    return this.periodObj.formatDate();
}

var CrossYearDisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

CrossYearDisplayFormatter.prototype.formatDisplay = function() {
    var year = this.periodObj.selectedPeriod + this.periodObj.offset;
    
    // For two digit years that span over the millenium.
    if (year >= 100 && year < 200) {
        year -= 100;
    }
    
    // For two digit years, if the year is less than 50, assume it's after the year 2000, otherwise assume it's before the year 2000.
    if (year < 50) {
        year += 2000;
    } else if (year < 100) {
        year += 1900;
    }
    
    year = (year-1) + '-' + year;
    
    return year;
}

var SevenDayDisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

SevenDayDisplayFormatter.prototype.formatDisplay = function() {
    
	var startDay = 0;
    var yearPeriod = this.periodObj.parentPeriod.parentPeriod;
    var monthPeriod = this.periodObj.parentPeriod;
    var year = yearPeriod.formatDate();
    if (this.periodObj.daysPerPeriod === 1) year = 2001;
    var month = monthPeriod.selectedPeriod;
    var day = this.periodObj.selectedPeriod;
    var date = new Date(year, 0, 1);
    
    var lastDay = new Date(year, month, 0).getDate();
    var firstDay = 1;
    
    while (date.getDay() !== startDay) {
        date.setDate(firstDay+=1);
    }
    firstDay = date.getDate();
    
    for (var i = 0; i < month-1; i+=1) {
        var daysInMonth = new Date(year, i+1, 0).getDate();
        var currentMonth = date.getMonth();
        while (date.getMonth() === currentMonth) {
            firstDay += this.periodObj.daysPerPeriod;
            date.setDate(firstDay);
            if (firstDay > daysInMonth) {
                firstDay -= daysInMonth;
            }
        }
    }
    
    var returnDayFirst = date.getDate() + (this.periodObj.daysPerPeriod * (day - 1));
    var returnDayLast = (returnDayFirst + (this.periodObj.daysPerPeriod - 1));
    var returnMonth = '';
    
    if (returnDayLast > lastDay) {
        if (monthPeriod.selectedPeriod === monthPeriod.maxPeriod || monthPeriod.selectedPeriod === monthPeriod.getPeriodsPerParent()) {
            var savedSelection = monthPeriod.selectedPeriod;
            monthPeriod.selectedPeriod = monthPeriod.minPeriod;
            returnMonth = monthPeriod.formatDisplay() + '. ';
            returnDayLast -= lastDay;
            monthPeriod.selectedPeriod = savedSelection;
        } else {
            monthPeriod.selectedPeriod +=1;
            returnMonth = monthPeriod.formatDisplay() + '. ';
            returnDayLast -= lastDay;
            monthPeriod.selectedPeriod -=1;
        }
    }
    
    if (returnDayFirst.toString().length === 1) returnDayFirst = '0'+returnDayFirst;
    if (returnDayLast.toString().length === 1) returnDayLast = '0'+returnDayLast;
	//var returnString = returnDayFirst + ' - ' + returnMonth + returnDayLast; 
	//console.log(returnString);
    //return returnDayFirst + ' - ' + returnMonth + returnDayLast;
	return returnDayFirst + '';
	//return returnDayFirst+' '+returnDayLast+' '+monthPeriod.selectedPeriod+' '+yearPeriod.formatDate();
	
}



var DailyDisplayFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

DailyDisplayFormatter.prototype.formatDisplay = function() {
    var startDay = 0;
    var yearPeriod = this.periodObj.parentPeriod.parentPeriod;
    var monthPeriod = this.periodObj.parentPeriod;
    var year = yearPeriod.formatDate();
    if (this.periodObj.daysPerPeriod === 1) year = 2001;
    var month = monthPeriod.selectedPeriod;
    var day = this.periodObj.selectedPeriod;
	var firstDay = this.periodObj.getFirstDay.get();
    var date = new Date(year, 0, firstDay);
    
    var lastDay = new Date(year, month, 0).getDate();
    
    for (var i = 0; i < month-1; i+=1) {
        var daysInMonth = new Date(year, i+1, 0).getDate();
        var currentMonth = date.getMonth();
        while (date.getMonth() === currentMonth) {
            firstDay += this.periodObj.daysPerPeriod;
            date.setDate(firstDay);
            if (firstDay > daysInMonth) {
                firstDay -= daysInMonth;
            }
        }
    }
    
    var returnDayFirst = date.getDate() + (this.periodObj.daysPerPeriod * (day - 1));
    var returnDayLast = (returnDayFirst + (this.periodObj.daysPerPeriod - 1));
    var returnMonth = '';
    
    if (returnDayLast > lastDay) {
        if (monthPeriod.selectedPeriod === monthPeriod.maxPeriod || monthPeriod.selectedPeriod === monthPeriod.getPeriodsPerParent()) {
            var savedSelection = monthPeriod.selectedPeriod;
            monthPeriod.selectedPeriod = monthPeriod.minPeriod;
            returnMonth = monthPeriod.formatDisplay() + '. ';
            returnDayLast -= lastDay;
            monthPeriod.selectedPeriod = savedSelection;
        } else {
            monthPeriod.selectedPeriod +=1;
            returnMonth = monthPeriod.formatDisplay() + '. ';
            returnDayLast -= lastDay;
            monthPeriod.selectedPeriod -=1;
        }
    }
    
    if (returnDayFirst.toString().length === 1) returnDayFirst = '0'+returnDayFirst;
    if (returnDayLast.toString().length === 1) returnDayLast = '0'+returnDayLast;
	return returnDayLast + '';
}

/**
 * Label formatters.
 *
 * These objects convert the selected period into the format required for the associated file name. 
 * Example: A four digit year period has a range from 2000 to 2010. Convert selected period of 1 into 2000, 2 into 2001, etc.
 */

var LabelFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

LabelFormatter.prototype.formatLabel = function() {
    return this.periodObj.selectedPeriod;
}

var DailyLabelFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

DailyLabelFormatter.prototype.formatLabel = function() {
    var selectedPeriod = this.periodObj.selectedPeriod;
    var daysPerPeriod = this.periodObj.daysPerPeriod;
    return ((selectedPeriod - 1) * daysPerPeriod) + 1;
}

var YearLabelFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

YearLabelFormatter.prototype.formatLabel = function() {
    var year = this.periodObj.selectedPeriod + this.periodObj.offset;
    
    if (this.periodObj.isCrossYear() === true && this.periodObj.childrenInNextYear() === false && this.periodObj.secondLabelVariable === null) {
        year -= 1;
    }
    
    return year;
}

/**
 * Date formatters.
 *
 * These objects convert the selected period into a number that can be used in a date object.
 */

var DateFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

DateFormatter.prototype.formatDate = function() {
    return this.periodObj.selectedPeriod;
}

var PeriodPerMonthDateFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

PeriodPerMonthDateFormatter.prototype.formatDate = function() {
    var periodsPerMonth = this.periodObj.getPeriodsPerParent();
    var yearPeriod = this.periodObj.getParentPeriodByName('year');
    var monthPeriod = this.periodObj.getParentPeriodByName('month');
    var year = yearPeriod.formatDate();
    var month = monthPeriod.formatDate();
    var daysInMonth = new Date(year, month+1, 0).getDate();
    var divisableDays = 31;
    
    while (divisableDays % periodsPerMonth !== 0) {
        divisableDays -= 1;
    }
    
    var daysPerPeriod = divisableDays / periodsPerMonth;
    var day = 1;
    var selectedPeriod = this.periodObj.selectedPeriod;
    for (var i = 1; i < selectedPeriod; i+=1) {
        day += daysPerPeriod;
    }
    
    return day;
}

var MonthDateFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

MonthDateFormatter.prototype.formatDate = function() {
    return this.periodObj.selectedPeriod - 1;
}

var YearDateFormatter = function(periodObj) {
    this.periodObj = periodObj;
}

YearDateFormatter.prototype.formatDate = function() {
    var year = this.periodObj.selectedPeriod + this.periodObj.offset;
    
    // For two digit years that span over the millenium.
    if (year >= 100 && year < 200) {
        year -= 100;
    }
    
    // For two digit years, if the year is less than 50, assume it's after the year 2000, otherwise assume it's before the year 2000.
    if (year < 50) {
        year += 2000;
    } else if (year < 100) {
        year += 1900;
    }
    
    if (this.periodObj.isCrossYear() === true && this.periodObj.childrenInNextYear() === false) {
        year -= 1;
    }
    
    return year;
}

/**
 * Number formatters.
 *
 * These objects take a number and either truncates or pads with leading zeros.
 */

var NumberFormatter = function(periodObj, digitCount) {
    this.periodObj = periodObj;
    this.digitCount = (typeof(digitCount) === 'undefined') ? null : digitCount;
}

NumberFormatter.prototype.formatNumber = function(number) {
    if (this.digitCount === null) return number;
    
    var string = number.toString();
    
    /*while (string.length > this.digitCount) {
        string = string.substr(1);
    }*/
    
    while (string.length < this.digitCount) {
        string = '0'+string;
    }
    
    return string;
}

/**
 * Periods per parent.
 *
 * These objects return the number of periods that exist for the selected parent period such as 12 months in a year, 31 days in January, 28 days in February, etc.
 */

var DaysPerMonth = function(periodObj) {
    this.periodObj = periodObj;
}

DaysPerMonth.prototype.getPeriodsPerParent = function() {
    var year = 2001;
    var month = this.periodObj.parentPeriod.selectedPeriod;
    var selectedPeriod = this.periodObj.selectedPeriod;
	var firstDay = this.periodObj.getFirstDay.get();
    var date = new Date(year, 0, firstDay);
    var dayCount = 0;
    
    for (var i = 0; i < month; i+=1) {
        var daysInMonth = new Date(year, i+1, 0).getDate();
        var currentMonth = date.getMonth();
        while (date.getMonth() === currentMonth) {
            if (i === month-1) {
                dayCount+=1;
            } 
            firstDay += this.periodObj.daysPerPeriod;
            date.setDate(firstDay);
            if (firstDay > daysInMonth) {
                firstDay -= daysInMonth;
            }
        }
    }
    
    return dayCount;
}

var DaysPerYear = function(periodObj) {
    this.periodObj = periodObj;
}

DaysPerYear.prototype.getPeriodsPerParent = function() {
    var yearPeriod = this.periodObj.getParentPeriodByName('year');
    var year = 2001;//yearPeriod.formatDate();
    var month = 1;
    var daysPerYear = 0;
    
    while (month <= 12) {
        // A date objects month is zero based so 0 is January, 1 is February, etc. A date objects day starts at 1.
        // Passing 0 for the day always selects the last day of the previous month.
        var date = new Date(year, month, 0);
        daysPerYear += date.getDate();
        month += 1;
    }
    
    return daysPerYear;
}

var StaticPeriodsPerParent = function(periodObj, periodsPerParent) {
    this.periodObj = periodObj;
    this.periodsPerParent = periodsPerParent;
}

StaticPeriodsPerParent.prototype.getPeriodsPerParent = function() {
    return this.periodsPerParent;
}

var TopPeriodsPerParent = function(periodObj) {
    this.periodObj = periodObj;
}

TopPeriodsPerParent.prototype.getPeriodsPerParent = function() {
    return this.periodObj.end - this.periodObj.start + 1;
}

var FirstWeekday = function(periodObj) {
	this.periodObj = periodObj;
}

FirstWeekday.prototype.get = function() {
	var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
	var weekday = weekdays.indexOf(this.periodObj.firstDay.toLowerCase());
    var year = this.periodObj.getParentPeriodByName('year').formatDate();
    var date = new Date(year, 0, 1);
    var firstDay = 1;
    
    while (date.getDay() !== weekday) {
        date.setDate(firstDay++);
    }
    firstDay = date.getDate();
	return firstDay;
}

var FirstDayOfYear = function(periodObj) {
	this.periodObj = periodObj;
}

FirstDayOfYear.prototype.get = function() {
    return this.periodObj.firstDay;
}

var getPeriodConfigs = function(startDate, endDate, dateFormat, startSeason, endSeason, forceMonth) {
    if (typeof(forceMonth) === 'undefined') forceMonth = false;
    if (typeof(startSeason) === 'undefined') startSeason = null;
    if (typeof(endSeason) === 'undefined') endSeason = null;
    
    var periodConfigs = [];
    var dateFormatParsed = dateFormat.split('-');
    var startDateParsed = startDate.split('-');
    var endDateParsed = endDate.split('-');
    var startDateObj = {};
    var endDateObj = {};
    for (var i = 0, len = dateFormatParsed.length; i < len; i+=1) {
        startDateObj[dateFormatParsed[i]] = parseInt(startDateParsed[i]);
        endDateObj[dateFormatParsed[i]] = parseInt(endDateParsed[i]);
    }
    
    if (startDateObj.hasOwnProperty('yyyy')) {
        var start = startDateObj['yyyy'];
        var end = endDateObj['yyyy'];
        if (start < 50) {
            start += 2000;
        } else if (start < 100) {
            start += 1900;
        }
        
        if (end < 50) {
            end += 2000;
        } else if (end < 100) {
            end += 1900;
        }
        
        var displayFormatter = YearDisplayFormatter;
        if (startSeason !== null && endSeason !== null) {
            if (parseInt(startSeason) > parseInt(endSeason)) {
                displayFormatter = CrossYearDisplayFormatter;
            }
        }
        
        var offset = start - 1;
        periodConfigs.push({
            name: 'year',
            title: 'Year',
            labelVariable: 'yyyy',
            start: 1,
            end: end - offset,
            offset: offset,
            periodsPerParent: TopPeriodsPerParent,
            dateFormatter: YearDateFormatter,
            labelFormatter: YearLabelFormatter,
            displayFormatter: displayFormatter
        });
    } else if (startDateObj.hasOwnProperty('yyyy1') && startDateObj.hasOwnProperty('yyyy2')) {
        var start = startDateObj['yyyy2'];
        var end = endDateObj['yyyy2'];
        if (start > end) end += 100;
        var offset = start - 1;
        end -= offset;
        
        periodConfigs.push({
            name: 'year',
            title: 'Year',
            labelVariable: 'yyyy2',
            secondLabelVariable: 'yyyy1',
            start: 1,
            end: end,
            offset: offset,
            periodsPerParent: TopPeriodsPerParent,
            dateFormatter: YearDateFormatter,
            labelFormatter: YearLabelFormatter,
            displayFormatter: CrossYearDisplayFormatter
        });
    }  else if (startDateObj.hasOwnProperty('yy1') && startDateObj.hasOwnProperty('yy2')) {
        var start = startDateObj['yy2'];
        var end = endDateObj['yy2'];
        if (start > end) end += 100;
        var offset = start - 1;
        end -= offset;
        
        periodConfigs.push({
            name: 'year',
            title: 'Year',
            labelVariable: 'yy2',
            secondLabelVariable: 'yy1',
            digitCount: 2,
            start: 1,
            end: end,
            offset: offset,
            periodsPerParent: TopPeriodsPerParent,
            dateFormatter: YearDateFormatter,
            labelFormatter: YearLabelFormatter,
            displayFormatter: CrossYearDisplayFormatter
        });
    } else if (startDateObj.hasOwnProperty('yy')) {
        var start = startDateObj['yy'];
        var end = endDateObj['yy'];
        if (start > end) end += 100;
        var offset = start - 1;
        end -= offset;
        var displayFormatter = YearDisplayFormatter;
        if (startSeason !== null && endSeason !== null) {
            // Check for cross year.
            if (parseInt(startSeason) > parseInt(endSeason)) {
                displayFormatter = CrossYearDisplayFormatter;
                var endPeriod = '';
                // Check if the current end period is in the first or second year of cross year.
                for (var format in endDateObj) {
                    if (format !== 'yy') endPeriod += endDateObj[format].toString();
                }
                
                if (parseInt(endPeriod) >= parseInt(startSeason)) {
                    end += 1;
                }
                if (offset !== -1) {  // If start year is 2000
                    end -= 1;
                    offset += 1;
                }
            }
        }
        
        periodConfigs.push({
            name: 'year',
            title: 'Year',
            labelVariable: 'yy',
            digitCount: 2,
            start: 1,
            end: end,
            offset: offset,
            periodsPerParent: TopPeriodsPerParent,
            dateFormatter: YearDateFormatter,
            labelFormatter: YearLabelFormatter,
            displayFormatter: displayFormatter
        });
    }
    
    if (startDateObj.hasOwnProperty('mm2')) {
        var config = {
            name: 'month',
            title: 'Month',
            labelVariable: 'mm2',
            digitCount: 2,
            start: startDateObj['mm2'],
            end: endDateObj['mm2'],
            periodsPerParent: 12,
            displayFormatter: MonthDisplayFormatter,
            dateFormatter: MonthDateFormatter
        };
        
        if (startSeason !== null) {
            config.startSeason = parseInt(startSeason.substr(0, 2));
            startSeason = startSeason.substr(2);
        }
        
        if (endSeason !== null) {
            config.endSeason = parseInt(endSeason.substr(0, 2));
            endSeason = endSeason.substr(2);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('mm')) {
        var config = {
            name: 'month',
            title: 'Month',
            labelVariable: 'mm',
            digitCount: 2,
            start: startDateObj['mm'],
            end: endDateObj['mm'],
            periodsPerParent: 12,
            displayFormatter: MonthDisplayFormatter,
            dateFormatter: MonthDateFormatter
        };
        
        if (startSeason !== null) {
            config.startSeason = parseInt(startSeason.substr(0, 2));
            startSeason = startSeason.substr(2);
        }
        
        if (endSeason !== null) {
            config.endSeason = parseInt(endSeason.substr(0, 2));
            endSeason = endSeason.substr(2);
        }
        
        periodConfigs.push(config);
    }
    
    if (startDateObj.hasOwnProperty('dd')) {
        var config = {
            name: 'day',
            title: 'Day',
            labelVariable: 'dd',
            digitCount: 2,
            daysPerPeriod: 1,
            start: startDateObj['dd'],
            end: endDateObj['dd'],
            periodsPerParent: DaysPerMonth
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('Pp')) {
        if (forceMonth === true) {
            var monthConfig = {
                name: 'month',
                title: 'Month',
                start: null,
                end: null,
                periodsPerParent: 12,
                displayFormatter: MonthDisplayFormatter,
                dateFormatter: MonthDateFormatter
            };
            
            if (startSeason !== null && endSeason !== null) {
                var monthStartSeason = 1;
                var monthEndSeason = 1;
                startSeason = parseInt(startSeason);
                endSeason = parseInt(endSeason);
                while (startSeason > 6) {
                    monthStartSeason += 1;
                    startSeason -= 6;
                }
                startSeason = 1;
                
                while (endSeason > 6) {
                    monthEndSeason += 1;
                    endSeason -= 6;
                }
                endSeason = 6;
                monthConfig.startSeason = monthStartSeason;
                monthConfig.endSeason = monthEndSeason;
            }
            
            periodConfigs.push(monthConfig);
        }
        
        var config = {
            name: 'pentad',
            title: 'Pentad',
            labelVariable: 'Pp',
            digitCount: 2,
            start: startDateObj['Pp'],
            end: endDateObj['Pp'],
            periodsPerParent: (forceMonth === true) ? 6 : 72,
            dateFormatter: PeriodPerMonthDateFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('pp')) {
        var config = {
            name: 'pentad',
            title: 'Pentad',
            labelVariable: 'pp',
            start: startDateObj['pp'],
            end: endDateObj['pp'],
            periodsPerParent: 6,
            dateFormatter: PeriodPerMonthDateFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('dk2')) {
        var config = {
            name: 'dekad',
            title: 'Dekad',
            labelVariable: 'dk2',
            start: startDateObj['dk2'],
            end: endDateObj['dk2'],
            periodsPerParent: 3,
            dateFormatter: PeriodPerMonthDateFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('Dk')) {
        if (forceMonth === true) {
            var monthConfig = {
                name: 'month',
                title: 'Month',
                start: null,
                end: null,
                periodsPerParent: 12,
                displayFormatter: MonthDisplayFormatter,
                dateFormatter: MonthDateFormatter
            };
            
            if (startSeason !== null && endSeason !== null) {
                var monthStartSeason = 1;
                var monthEndSeason = 1;
                startSeason = parseInt(startSeason);
                endSeason = parseInt(endSeason);
                while (startSeason > 3) {
                    monthStartSeason += 1;
                    startSeason -= 3;
                }
                startSeason = 1;
                
                while (endSeason > 3) {
                    monthEndSeason += 1;
                    endSeason -= 3;
                }
                endSeason = 3;
                monthConfig.startSeason = monthStartSeason;
                monthConfig.endSeason = monthEndSeason;
            }
            
            periodConfigs.push(monthConfig);
        }
        
        var config = {
            name: 'dekad',
            title: 'Dekad',
            labelVariable: 'Dk',
            digitCount: 2,
            start: startDateObj['Dk'],
            end: endDateObj['Dk'],
            periodsPerParent: (forceMonth === true) ? 3 : 36,
            dateFormatter: PeriodPerMonthDateFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('dk')) {
        var config = {
            name: 'dekad',
            title: 'Dekad',
            labelVariable: 'dk',
            start: startDateObj['dk'],
            end: endDateObj['dk'],
            periodsPerParent: 3,
            dateFormatter: PeriodPerMonthDateFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('PPP')) {
        periodConfigs.push({
            name: 'month',
            title: 'Month',
            start: null,
            end: null,
            periodsPerParent: 12,
            displayFormatter: MonthDisplayFormatter,
            dateFormatter: MonthDateFormatter
        });
        
        var offset = 0;
        var start = startDateObj['PPP'];
        var end = endDateObj['PPP'];
        
        while (start % 8 !== 0) {
            start -= 1;
            end -= 1;
            offset +=1;
        }
        
        start = (start / 8) + offset;
        end = (end / 8) + offset;
        
        var config = {
            name: '8-day',
            title: 'Days',
            labelVariable: 'PPP',
            digitCount: 3,
            daysPerPeriod: 8,
            start: start,
            end: end,
            periodsPerParent: DaysPerMonth,
            labelFormatter: DailyLabelFormatter,
            displayFormatter: DailyDisplayFormatter
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    } else if (startDateObj.hasOwnProperty('D')) {
        periodConfigs.push({
            name: 'month',
            title: 'Month',
            start: null,
            end: null,
            periodsPerParent: 12,
            displayFormatter: MonthDisplayFormatter
        });
        
        var config = {
            name: 'day',
            title: 'Day',
            labelVariable: 'D',
            daysPerPeriod: 1,
            start: startDateObj['D'],
            end: endDateObj['D'],
            periodsPerParent: DaysPerMonth
        };
        
        if (startSeason !== null && endSeason !== null) {
            config.startSeason = parseInt(startSeason);
            config.endSeason = parseInt(endSeason);
        }
        
        periodConfigs.push(config);
    }
    
    return periodConfigs;
}
