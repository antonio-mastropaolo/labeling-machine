function get_elapsed_seconds() {
    var date_now = new Date();
    var time_now = date_now.getTime();
    var time_diff = time_now - startTime;
    var seconds_elapsed = Math.floor(time_diff / 1000);

    startTime = (new Date()).getTime(); //reset timer

    return (seconds_elapsed);
}

function skip_next_artifact() {
    if (confirm('Are you sure?')) {
        window.location.pathname = '/labeling';
    }
}


function ChangeSkipToNext() {
    $("#next-skip-btn").text("Next");
    $("#next-skip-btn").removeClass("btn-outline-success");
    $("#next-skip-btn").addClass("btn-success");
}

function inRange(x, min, max) {
    x=Number(x);
    min=Number(min);
    max=Number(max);
    return ((x-min)*(x-max) <= 0);
}

function createNewCategory() {
    var newCategory = prompt("","Text");
    $("#new-category-button").text(newCategory);
}

function moveToSelectedMethod(startingLine) {
    var selector = '.row-line:contains(' + startingLine + ')';
    $(selector)[0].scrollIntoViewIfNeeded();


    $(selector).addClass('animationLabel').delay(1500).queue(function(){
        $(this).removeClass('animationLabel').dequeue();
    });

}



/*
function getFirstLineofSelection() {
            var node,selection;
            //console.log(getSelection().getRangeAt(0));
            if (window.getSelection) {
              selection = getSelection();
              node = selection.anchorNode;
            }
            if (!node && document.selection) {
                selection = document.selection
                var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
                node = range.commonAncestorContainer ? range.commonAncestorContainer :
                       range.parentElement ? range.parentElement() : range.item(0);
            }

            //console.log('Logging starting line: '+node.parentNode.previousSibling.previousSibling.textContent);

            return node.parentNode.previousSibling.previousSibling.textContent;
        }
 */

/*

 function highlightSelection(lines, isReviewer=false, colorHighlighting="blue"){
            var snippet = "";
            console.log(lines);
            for(var i=0; i<lines.length;i++){
                var lineTarget = Number(lines[i]);
                var lineSelector = ".linenos:contains(" + (lineTarget) + ")";

                var siblings = $(lineSelector).nextAll();


                for(var j=0;j<siblings.length;j++){
                    if (siblings[j].textContent==lineTarget+1){
                        break;
                    }
                    else{
                        $(siblings[j]).css('background-color',colorHighlighting);
                        snippet = snippet + $(siblings[j]).text();
                        if(!isReviewer){
                            dictHighlightedElements[counterAssociations].push(siblings[j]);
                        }
                    }
                }
                updateTextArea(snippet);
            }

        }
 */




