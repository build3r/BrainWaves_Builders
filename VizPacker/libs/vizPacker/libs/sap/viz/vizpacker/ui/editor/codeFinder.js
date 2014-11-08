define([], function() {
    function searchOverlay(query) {
        if (typeof query === "string")
            return {token: function(stream) {
                    if (stream.match(query))
                        return "searching";
                    stream.next();
                    stream.skipTo(query.charAt(0)) || stream.skipToEnd();
                }};
        return {token: function(stream) {
                if (stream.match(query))
                    return "searching";
                while (!stream.eol()) {
                    stream.next();
                    if (stream.match(query, false))
                        break;
                }
            }};
    }

    function SearchState() {
        this.posFrom = this.posTo = this.query = null;
        this.overlay = null;
    }
    function getSearchState(cm) {
        return cm.state.search || (cm.state.search = new SearchState());
    }
    function getSearchCursor(cm, query, pos) {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(query, pos, typeof query === "string" && query === query.toLowerCase());
    }
    function doSearch(cm, query, highlightAll, rev) {
        var state = getSearchState(cm);
        if (state.query && state.query === query) {
            if (highlightAll === true)
                cm.addOverlay(state.overlay);
            else 
                findNext(cm, rev);
        } else {
            clearSearch(cm);
            state = getSearchState(cm);
        }
        cm.operation(function() {
            if (!query || state.query)
                return;
            state.query = query;
            cm.removeOverlay(state.overlay);
            state.overlay = searchOverlay(state.query);
            if (highlightAll === true)
                cm.addOverlay(state.overlay);
            state.posFrom = state.posTo = cm.getCursor();
            findNext(cm, rev);
        });
    }
    function findNext(cm, rev) {
        cm.operation(function() {
            var state = getSearchState(cm);
            var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
            if (!cursor.find(rev)) {
                cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
                if (!cursor.find(rev))
                    return;
            }
            cm.setSelection(cursor.from(), cursor.to());
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
        });
    }
    function clearSearch(cm) {
        cm.operation(function() {
            var state = getSearchState(cm);
            if (!state.query)
                return;
            state.query = null;
            cm.removeOverlay(state.overlay);
        });
    }
    
    
    /*replace*/
    function replace(cm, query, text, all) {
        if (all) {
            cm.operation(function() {
                for (var cursor = getSearchCursor(cm, query); cursor.findNext(); ) {
                    cursor.replace(text);
                }
            });
        } else {
            clearSearch(cm);
            var cursor = getSearchCursor(cm, query, cm.getCursor());
            var advance = function() {
                var start = cursor.from(), match;
                if (!(match = cursor.findNext())) {
                    cursor = getSearchCursor(cm, query);
                    if (!(match = cursor.findNext()) ||
                            (start && cursor.from().line === start.line && cursor.from().ch === start.ch))
                        return;
                }
                cm.setSelection(cursor.from(), cursor.to());
                doReplace(match);
            };
            var doReplace = function(match) {
                cursor.replace(typeof query === "string" ? text :
                        text.replace(/\$(\d)/, function(_, i) {
                    return match[i];
                }));
//                advance();
            };
            advance();
        }
    }    

    return {
        doSearch: doSearch,
        findNext: findNext,
        clearSearch: clearSearch,
        highlightAll: function(cm, query) {
            doSearch(cm, query, true);
        },
        replace: replace,
        replaceAll: function(cm, query, text) {
            replace(cm, query, text, true);
        }
    };
});