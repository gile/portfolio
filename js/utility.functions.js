
(function defineUtilityFunctions() {
    
    MY_COLOR_PALETTE = {
        RED: "#e53338",
        GREEN: '#77a706',
        DARK_GREEN: '#006400',
        YELLOW: '#E8BE56',
        DARK_BLUE: '#32597C',
        LIGHT_BLUE: '#5C99CC',
        DARK_GRAY: '#555',
        LIGHT_GRAY: '#B5B3B3',
        WHITE: '#FFF',
        BLACK: '#000'
    };

    //console.log('defineUtilityFunctions');

    String.prototype.replaceSpaces = String.prototype.replaceSpaces || function() {
        return this.replace(/ /g,'_').replace(/\'/g,'');
    }

    String.prototype.restoreSpaces = String.prototype.restoreSpaces || function() {
        return this.replace(/_/g,' ');
    }

    String.prototype.removeCommas = String.prototype.removeCommas || function() {
        return this.replace(/,/g,'');
    }

    String.prototype.hasSubstring = String.prototype.hasSubstring || function(substring) {
        return this.indexOf(substring) !== -1;
    }

window.createDomElement = window.createDomElement || function($parent, elementName, identifier, elementType) {
        var identifier = (identifier) ? '_' + identifier : "",
            elementType = elementType || 'div',
            elementId = elementName + identifier,//elementName.getScopedId(identifier),
            elementClass = elementName,
            element = '<' + elementType + ' id="' + elementId + '" class="' + elementClass + '"></' + elementType + '>';

        $parent.append(element);
        return $('#' + elementId);
    }   

    window.get_browser = function ()
    {
        var N = navigator.appName,
            ua = navigator.userAgent,
            tem;

        var M=ua.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*(\.?\d+(\.\d+)*)/i);

        if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) {
            M[2] = tem[1];
        }
        M=M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];

        return {browser: M[0], version: M[1]};
    }

    window.hasSubstring = function(string, substring) { return string.indexOf(substring) !== -1; }

    window.getSign = function(number) { return number ? number / Math.abs(number) : 1; }

    window.isString = function(obj) { return typeof(obj)=='string'; }

    window.isNumeric = function(obj) { return (!isNaN(obj) && !isString(obj) && obj !== null && obj !== undefined); }
    
    window.getNumericValue = function(obj, isPercent) {
        isPercent = isPercent || false;

        var data = obj.data,
            stringValue = obj.text,
            value;

        if(isNumeric(obj)) {
            return obj;
        }

        

        if(isString(obj)) {
            value = parseFloat(obj.removeCommas());
            return isNumeric(value) ? value : undefined;
        }

        if (data) {
            // the data member needs to be multiplied by 100 to get percent
            return isPercent ? data  : data;
        }
        else if (stringValue) {
            var a = stringValue.removeCommas();
            var b = parseFloat(a);
            var c = isNaN(b);

            if (c) {
                return undefined;
            }
            return parseFloat(stringValue.removeCommas());
        }
        return undefined;
    }
    
    window.getMyColor = function(colorName) {
        var color = colorName.toLowerCase();

        switch(color) {
            case "red":
                return MY_COLOR_PALETTE.RED;
                break;

            case "green":
                return MY_COLOR_PALETTE.GREEN;
                break;

            case "darkgreen":
            case "dark_green":
            case "dark-green":
            case "dark green":
                return MY_COLOR_PALETTE.DARK_GREEN;
                break;

            case "yellow":
                return MY_COLOR_PALETTE.YELLOW;
                break;

            case "lightblue":
            case "light_blue":
            case "light-blue":
            case "light blue":
                return MY_COLOR_PALETTE.LIGHT_BLUE;
                break;

            case "blue":
            case "darkblue":
            case "dark_blue":
            case "dark-blue":
            case "dark blue":
                return MY_COLOR_PALETTE.DARK_BLUE;
                break;

            case "gray":
            case "grey":
            case "lightgray":
            case "light_gray":
            case "light-gray":
            case "light gray":
            case "lightgrey":
            case "light_grey":
            case "light-grey":
            case "light grey":
                return MY_COLOR_PALETTE.LIGHT_GRAY;
                break;

            case "darkgray":
            case "dark_gray":
            case "dark-gray":
            case "dark gray":
            case "darkgrey":
            case "dark_grey":
            case "dark-grey":
            case "dark grey":
                return MY_COLOR_PALETTE.DARK_GRAY;
                break;

            case "white":
                return MY_COLOR_PALETTE.WHITE;
                break;

            case "black":
            default:
                return MY_COLOR_PALETTE.BLACK;
                break;
        }
    }

}());


var widgetHelper = (function() {

    var me = {};

    me.getWidth = function (element) {

        return $(element).closest('span').children(0).width();
    }

    me.getHeight = function (element) {

        return $(element).closest('span').children(0).height();
    }    

    return me;
}());