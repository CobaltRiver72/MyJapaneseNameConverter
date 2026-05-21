(function() {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[1] === 'string') {
            args[1] = args[1].replace(/^https:\/(?!\/)/, 'https://');
            args[1] = args[1].replace(/^http:\/(?!\/)/, 'http://');
        }
        return origOpen.apply(this, args);
    };
})();
