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
    window.location.pathname = '/labeling';
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

function highlightTargetComments(elements,className){

    function look4Javadoc(comment){
        var commentLines = comment.split('\n');
        for(var i=0;i<commentLines.length;i++){
            if(commentLines[i].trim().startsWith('*') && !commentLines[i].trim().startsWith('*/')){
                return true
            }
        }
        return false;
    }

    for(var i=0;i<elements.length;i++){
        if(elements[i].innerHTML.startsWith('/**') || elements[i].innerHTML.startsWith('/* *') || look4Javadoc(elements[i].innerHTML)){
            //console.log('hit javadoc');
            continue
        }
        else{
             $(elements[i]).addClass(className);
             //elements[i].setAttribute('onclick','selectText(this)')
        }
    }

}

function getSelectionParentElement() {
    var parentEl = null, sel;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            parentEl = sel.getRangeAt(0).commonAncestorContainer;
            if (parentEl.nodeType != 1) {
                parentEl = parentEl.parentNode;
            }
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        parentEl = sel.createRange().parentElement();
    }
    return parentEl;
}

function getSelectionCharOffsetsWithin(element) {
    var start = 0, end = 0, text = "";
    var sel, range, priorRange;
    if (typeof window.getSelection != "undefined") { // Non-IE
        if (window.getSelection().toString() != "") {
            range = window.getSelection().getRangeAt(0);
            priorRange = range.cloneRange();
            priorRange.selectNodeContents(element);
            priorRange.setEnd(range.startContainer, range.startOffset);
            start = priorRange.toString().length;
            end = start + range.toString().length;
            // Get text
            text = range.toString();
        }
    } else if (typeof document.selection != "undefined" && (sel = document.selection).type != "Control") {  // IE
        range = sel.createRange();
        priorRange = document.body.createTextRange();
        priorRange.moveToElementText(element);
        priorRange.setEndPoint("EndToStart", range);
        start = priorRange.text.length;
        end = start + range.text.length;
        // Try with IE
        text = range.text;
    }

    //handling click event on the right side of the text area
    try{
        targetTag = range.commonAncestorContainer;
    }catch(e){
        targetTag = null;

    }

    return {
        start: start,
        end: end,
        text: text,
        targetTag: targetTag,
        range: range
    };
}


function highlightRange(range) {
    var newNode = document.createElement("div");
    newNode.setAttribute(
       "style",
       "background-color: green; display: inline;"
    );
    range.surroundContents(newNode);
}


function reset(save=false){

    $("#textAreaSelectedText").text("");
    $('.category-button').css("background-color",'');
    $("#new-category-button").text("Define New Category");

    selectedLines = []
    selectedCategory = "";
    selectedCodeText = "";
    selectedCommentText = "";

    if(!save) {
        resetHighlightedComment(dictHighlightedComments[counterAssociations]);
        $(dictHighlightedCode[counterAssociations]).css('background-color','');
    }

    elementsToHighlight = [];
    dictHighlightedComments[counterAssociations] = []
}

function resetHighlightedComment(customList){
    for (var i = 0; i < customList.length; i++) {
         $(customList[i][0]).css('color', '');
    }
}

function checkForButtonValidity(){
    let textBoxVal = $("#textAreaSelectedText").val();
    if(textBoxVal==""|| (!textBoxVal.trim().startsWith("//") && !textBoxVal.trim().startsWith("/*") && !textBoxVal.trim().startsWith('/**')  )) {
        alert("Select a comment first!");
        return false;
    }
    return true;
}

 function updateTextArea(textToDisplay){
    var previousSelection = $("#textAreaSelectedText").val().toString();
    if(previousSelection==""){
        $("#textAreaSelectedText").text(textToDisplay);
    }else{
        $("#textAreaSelectedText").text(previousSelection + "\n" + textToDisplay);

    }
}


function checkForChangedCategory(element){

    function arrayRemove(arr, value) {

            return arr.filter(function(ele){
                return ele != value;
            });
        }

    var refinedCategories = arrayRemove(labelCategories, element.id.toString());

    for(var i=0;i<refinedCategories.length;i++){
        var selector="#"+refinedCategories[i];
        $(selector).css('background-color','');
    }
}

function addNewCommentToBeLinked(element){
    var retCode=checkForButtonValidity();
    if (!retCode) { return false;}
    checkForChangedCategory(element);
    if(element.id.toString()=="new-category-button"){
        createNewCategory();
    }
    $(element).css('background-color','green');
    selectedCategory = element.id.toString();
    selectedCommentText =  $("#textAreaSelectedText").val().toString(); //at this stage we must have only the code comment/s

}


function isSelectedCategory(){
    if(selectedCategory==""){
        alert("First link the given comment to the snippet!");
        resetHighlightedComment(dictHighlightedCode[counterAssociations]);
        return false;
    }else{
        return true;
    }

}

function saveCategorization(){

    if (isSelectedCategory()){
        //save snippet
        var allSelection = $("#textAreaSelectedText").val().toString();
        selectedCodeText = allSelection.replace(selectedCommentText,'');
        console.log('Debug: ' + selectedCodeText + '--------- ' + selectedCommentText);
        if(selectedCodeText==""){
            alert("First link the given comment to the snippet!");
            resetHighlightedComment(dictHighlightedCode[counterAssociations]);
            $("#"+selectedCategory).css('background-color','');
            return false;
        }

        //console.log(selectedCommentText);
        //console.log(selectedCodeText);
        //console.log(selectedLines);

        $("#textAreaSelectedText").text("");
        for(var i=0;i<labelCategories.length;i++){
            var selector="#"+labelCategories[i];
            $(selector).css('background-color','');
        }

        //Add new association button
        var divID = "div-association" + '-' + counterAssociations; //+ "-" + target_method;
        var buttonID = "association" + '-' + counterAssociations;// + "-" + target_method;
        var buttonText = "#" + counterAssociations+ " -->";// + target_method;
        //var scorllCall = 'moveToSelectedMethod('+ selectedLines[0]+')';
        var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="' + "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-trash-alt fa-2x" style="position:sticky; left:95%;" onclick="removeAssociation(\''+ divID +'\')"></i></button></div>';

        $( "#lowerSide" ).append( $(newButton) );

        //adding tag result to the lists we store in the DB
        selectedComments.push(selectedCommentText);
        selectedCode.push(selectedCodeText);
        selectedCategories.push(selectedCategory);
        selectedSpanCode.push()

        counterAssociations  = counterAssociations + 1;
        $("#badgeCounter").text(counterAssociations);


        reset(save=true);

    }

}

function removeAssociation(divID){
    targetAssociation = divID.split('-')[2];
    $('#'+divID).fadeOut(300, function(){ $(this).remove();});
    counterAssociations = counterAssociations -1;
    $("#badgeCounter").text(counterAssociations);

    //removing highlighting for code and comment
    $(dictHighlightedCode[targetAssociation]).css('background-color','')
    resetHighlightedComment(dictHighlightedComments[targetAssociation]);
}


function unselectAll(){

    if (document.selection && document.selection.empty)
    {
        document.selection.empty();
    }
    else if (window.getSelection)
    {
        var sel= window.getSelection();
        if(sel && sel.removeAllRanges)
            sel.removeAllRanges();
    }
}


