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

function moveToSelectedMethod(indexClassification) {
    var arr = Array.from(comments);
    console.log('inside');
    console.log(dictHighlightedCommentsPosition[indexClassification]);
    indexComment = dictHighlightedCommentsPosition[indexClassification].toString();
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });
}


function highlightCodeFromRange(range){
    var newNode = document.createElement("span");
    //Adding ID for the given selection that is gonna be useful when we want to remove the highlighted text
    if(isLabeled==0) { newNode.setAttribute("id", "highlight-" + counterAssociations); }
    else{ newNode.setAttribute("id", "highlight-" + currentClassification);}
    newNode.setAttribute("style", "background-color: #FFE5CC");
    newNode.appendChild(range.extractContents());
    range.insertNode(newNode);
    dictHighlightedCode[counterAssociations] = newNode;
    return newNode;
}

function moveToSelectedMethodFromTag(indexComment, indexClassification) {

    var arr = Array.from(comments);
    indexComment = indexComment.toString();
    console.log(indexClassification);
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    currentClassification = indexClassification;

    //console.log(dictHighlightedCommentsPosition);
    //console.log(selectedComments);


    $("#"+selectedCategories[currentClassification]).css('background-color','green'); //highlight the select button category

    //move down to the selected method
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });

    //deactivating other classification buttons
    const keys = Object.keys(dictRangeHighlightedCode);
    //console.log(keys);
    for(var i=0;i<keys.length;i++){
        if(dictRangeHighlightedCode[i].length==0 || i==indexClassification){
            continue;
        }else{
            $('#association-'+i).attr('disabled','disabled');
        }
    }

    ////////////////////////////////////////////////////
    //Highlight the selected comment

    //console.log(selectedComments);

    for(var j=0;j<selectedComments.length;j++) {

        currentIndexComment = Number(j);
        // We highlight the previously made classification
        const position = dictHighlightedCommentsPosition[indexClassification][currentIndexComment];
        $(comments[position]).css('color', 'red');
        highlightedCommentsInReviewing.push(comments[position]);
        updateTextArea($(comments[position]).text());
    }

    /////////////////////////////////////////////////////////////////////////////////////////////

    //Highlight the selected code
    for(var i=0;i<dictRangeHighlightedCode[currentClassification].length;i++){
        var deseriazedRange = rangy.deserializeRange(dictRangeHighlightedCode[currentClassification][i]);
        var newNode = document.createElement("span");

        //Adding ID for the given selection that is gonna be useful when we want to remove the highlighted text
        newNode.setAttribute("id", "highlight-" + currentClassification);
        newNode.setAttribute("style", "background-color: #FFE5CC");
        newNode.appendChild(deseriazedRange.extractContents());
        deseriazedRange.insertNode(newNode);
        updateTextArea(newNode.textContent);
    }

    //highlight the category button
    // var bSelector = `#${selectedCategories[indexComment]}`;
    // $(bSelector).css('background-color','green')

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
        }
    }

}

function getSelectionCharOffsetsWithin(element) {
    var start = 0, end = 0, text = "";
    var sel, range, priorRange, serializedRange;
    if (typeof window.getSelection != "undefined") { // Non-IE
        if (window.getSelection().toString() != "") {
            range = window.getSelection().getRangeAt(0);
            priorRange = range.cloneRange();
            priorRange.selectNodeContents(element);
            priorRange.setEnd(range.startContainer, range.startOffset);
            start = range.toString().length;
            end = start + range.toString().length;
            // Get text
            text = range.toString();
            serializedRange = rangy.serializeRange(range,true);

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
        range: range,
        serializedRange: serializedRange
    };
}

function reset(save=false){

    $("#textAreaSelectedText").text("");
    $('.category-button').css("background-color",'');
    $("#new-category-button").text("Define New Category");


    if(!save) {
        changeCommentHighlighting(commentEleToHighlight,'', true);
        if(isLabeled==1){
            //reset code
            var spanSelector = "[id=highlight-"+(currentClassification)+"]";
            $(spanSelector).css('background-color','').attr("id","old-span");
        }else {
            resetHighlightedCode(dictHighlightedCode[counterAssociations], counterAssociations);
        }
    }

    if(isLabeled==1 && save){
        //changing previous span token(highlighting) with the green one
        var selector = "[id=highlight-"+(currentClassification)+"]";
        $(selector).css('background-color','#CCFFE5');


        //removing highlighting from the comment
        changeCommentHighlighting(null,'green', false);
        $("#association-"+currentClassification).fadeOut(300, function(){ $(this).remove();});

        /*for(var i=currentClassification+2;i<moveSelectionButtonList.length;i++){
            $("#association-"+i).attr('disabled','disabled');
        }*/

        if(counterAssociations==0){
            ShowNotification('You have reviewed all the instances....Please submit the new classification','success', 500);
        }

    }else if(isLabeled==0 && save){
        var selector = "[id=highlight-"+(currentClassification)+"]";
        $(selector).css('background-color','');

        //changing highlighting for the comment and code
        changeCommentHighlighting(commentEleToHighlight, 'green', false);
        for(var i=0;i< highlightedCodeDuringSelection.length;i++){
            $(highlightedCodeDuringSelection[i]).css('background-color','#CCFFE5');
        }
        counterAssociations = counterAssociations+1;
    }

    //deactivate button until the changes are completed and brought to the staging area
    if(isLabeled==1 && flagSwitch){
        //$("#clearText").attr('disabled','disabled');
        $("#clearText").text('Reset');
        var bSelector = `#${selectedCategories[currentIndexComment]}`;
        $(bSelector).css('background-color','');
        changingToClassificationOnGoing=true; //the reviewer is about to change the classification
        flagSwitch=false;
    }

    commentEleToHighlight = [];
    commentIndex=[];
    serializedRangeList=[];
    //dictHighlightedComments[counterAssociations] = []
    //dictRangeHighlightedCode[counterAssociations] = []; //making space for the next classification
    //dictHighlightedCommentsPosition[counterAssociations]=[];
    //dictHighlightedComments[counterAssociations]=[];
    highlightedCommentsInReviewing=[];
    highlightedCodeDuringSelection = [];

    resetClicked=false;
    selectedCategory = "";
    selectedCodeText = "";
    selectedCommentText = "";

    unselectAll();
}

function resetHighlightedCode(customList=null, targetItem){
    var item='highlight-'+targetItem;
    $(`span[id=${item}]`).css('background-color','');
    /*if(isLabeled === 0){
        var cnt = $(`span[id=${item}]`).contents();
        $(`span[id=${item}]`).replaceWith(cnt);
    }
    else{ $(`span[id=${item}]`).css('background-color',''); }*/
}

function changeCommentHighlighting(customList, color, reset=false){
    //console.log(customList);
    if(isLabeled === 0) {
        for (var i = 0; i < customList.length; i++) {
            $(customList[i][0]).css('color', color);
        }
    }else if (isLabeled === 1){
        if(reset){
            console.log(highlightedCommentsInReviewing);
            for(var i=0;i<highlightedCommentsInReviewing.length;i++){
                $(highlightedCommentsInReviewing[i]).css('color','');
            }
        }else{
            //no changes have been made
            if(commentEleToHighlight.length==0) { commentEleToHighlight = highlightedCommentsInReviewing; }
            for(var i=0;i<commentEleToHighlight.length;i++){
                $(commentEleToHighlight[i]).css('color','green');
            }
        }
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
    var refinedText = $("#textAreaSelectedText").text().replace(/^\s*\n/gm, "");
    $("#textAreaSelectedText").text(refinedText);
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
    if(element.id.toString() === "new-category-button"){
        createNewCategory();
    }
    $(element).css('background-color','green');
    selectedCategory = element.id.toString();
    if(selectedCategory === 'new-category-button'){ //save the new category
        selectedCategory = $(element).text() + '-button';
    }
    selectedCommentText =  $("#textAreaSelectedText").val().toString(); //at this stage we must have only the code comment/s

}


function isSelectedCategory(){
    if(selectedCategory=="" && isLabeled==0){
        alert("First link the given comment to the snippet!");
        changeCommentHighlighting(dictHighlightedCode[counterAssociations]);
        return false;
    }else{
        return true;
    }

}

function saveCategorization(){

    dictHighlightedCode[counterAssociations] = highlightedCodeDuringSelection;

    if (commentEleToHighlight.length >0 ) {dictHighlightedComments[counterAssociations] = commentEleToHighlight; }

    if (isSelectedCategory()){
        //save snippet

        if(selectedCodeText.trim() ==="" && resetClicked){
            alert("First link the given comment to the snippet!");
            $("#"+selectedCategory).css('background-color','');
            return false;
        }


        $("#textAreaSelectedText").text("");
        for(var i=0;i<labelCategories.length;i++){
            var selector="#"+labelCategories[i];
            $(selector).css('background-color','');
        }

        if(isLabeled === 0) {

            //adding tag result to the lists we store in the DB
            selectedComments.push(selectedCommentText);
            selectedCode.push(selectedCodeText);
            selectedCategories.push(selectedCategory);
            dictRangeHighlightedCode[counterAssociations] = serializedRangeList;
            dictHighlightedCommentsPosition[counterAssociations] = [...new Set(commentIndex)];
            console.log('inside saveClass: ');
            console.log(dictHighlightedCommentsPosition);

            //Add new association button
            var divID = "div-association" + '-' + counterAssociations; //+ "-" + target_method;
            var buttonID = "association" + '-' + counterAssociations;// + "-" + target_method;
            var buttonText = "#" + counterAssociations+ " -->";// + target_method;
            var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + counterAssociations + ");" +  "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-check fa-2x" style="position:sticky; left:95%;" </i></button></div>';

            //var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="' + "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-check fa-2x" style="position:sticky; left:95%;" </i></button></div>';
            //onclick="removeAssociation(\''+ divID +'\')">

            // handling list for the reviewing part
            var moveToButton = '<div class="buttonWrapper" id="' + divID + '"><button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick=" moveToSelectedMethodFromTag([' + dictHighlightedCommentsPosition[counterAssociations] + '],' +counterAssociations + ');" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + ' + </button></div>';
            methodSelectionButton.push(moveToButton);

            $("#badgeCounter").text(counterAssociations+1);
            $("#lowerSide" ).append( $(newButton) );

        }

        //Bringing back the change button and remove selectionButton
        if(isLabeled==1){

            // if the reviewer didn't change anything, it will overwrite such fields
            if (selectedCommentText.trim() !== '') { selectedComments[currentClassification] = selectedCommentText; }
            if (selectedCodeText.trim() !== '')    { selectedCode[currentClassification] = selectedCodeText; }
            if (selectedCategory.trim() !== '')    { selectedCategories[currentClassification] = selectedCategory;}
            if (serializedRangeList.length>0)      { dictRangeHighlightedCode[currentClassification] = serializedRangeList; }
            if (commentIndex.length>0)             { dictHighlightedCommentsPosition[currentClassification] = [...new Set(commentIndex)]; } //duplicates deletion due to mis-selection event

            //console.log(selectedCategories);
            //console.log(selectedComments);
            //console.log(selectedCode);
            //console.log(dictRangeHighlightedCode[currentClassification]);

            $("#clearText").text('Change');


            try {
                var flagIN = false;

                var counter = currentClassification + 1;
                var extractedItemToMatch = dictHighlightedCommentsPosition[counter];


                while (extractedItemToMatch.length === 0) {
                    counter = counter + 1;
                    //console.log('inin ' + counter);
                    extractedItemToMatch = dictHighlightedCommentsPosition[counter];
                    flagIN = true;
                }
                //if(flagIN){ currentClassification=counter; console.log(currentClassification); }
                $('#association-' + counter).removeAttr('disabled');
            }catch(e){
                $('#association-' + currentClassification).removeAttr('disabled');
            }


            //var bSelector = '#'+selectedCategories[currentClassification];
            //$(bSelector).css('background-color','');
            flagSwitch=false;
            counterAssociations = counterAssociations - 1;
            $("#badgeCounter").text(counterAssociations);

        }

        reset(save=true);
    }

}

// function removeAssociationFromTag(){
//
//     $(flexibleSelector).fadeOut(300, function(){ $(this).remove();});
//     counterAssociations = counterAssociations - 1;
//     $("#badgeCounter").text(counterAssociations);
//     $("#textAreaSelectedText").text('');
// }

function removeAssociation(divID){

    targetAssociation = divID.split('-')[2];
    $('#'+divID).fadeOut(300, function(){ $(this).remove();});
    counterAssociations = counterAssociations -1;
    $("#badgeCounter").text(counterAssociations);

    //removing highlighting for code and comment
    resetHighlightedCode($(dictHighlightedCode[targetAssociation]),targetAssociation);
    if(commentEleToHighlight.length==0){
        //console.log(dictHighlightedComments);
        changeCommentHighlighting(dictHighlightedComments[targetAssociation], '');
    }else{
        //console.log(commentEleToHighlight);
        changeCommentHighlighting(commentEleToHighlight, '');
    }

    dictRangeHighlightedCode[targetAssociation] = [];
    dictHighlightedCommentsPosition[targetAssociation] = [];
    methodSelectionButton[targetAssociation] = [];
    selectedComments[targetAssociation] = [];
    selectedCategories[targetAssociation] = [];
    selectedCode[targetAssociation] = [];
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

function commentWithin(text){
    var lines = text.split('\n');
    for(var i=0;i<lines.length;i++){
        if(lines[i].trim().startsWith('//')){
            return true;
        }
    }
    return false;
}

