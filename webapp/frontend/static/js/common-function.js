const delay = ms => new Promise(res => setTimeout(res, ms));

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



function moveToSelectedMethod(indexClassification){
    var arr = Array.from(comments);
    console.log(dictHighlightedCommentsPosition);
    indexComment = dictHighlightedCommentsPosition[indexClassification].toString();
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });
}

function moveToSelectedMethodFromLine(lineNumber){
    var tagSelector = $(`.row-line:contains(${lineNumber})`);
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });
}

// Function adapted from: https://stackoverflow.com/questions/6240139/highlight-text-range-using-javascript
function highlightRangeNew(start, end){

    let cur = 0;
    let replacements = [];

    var selector = document.getElementById("code");

    function dig(node){
        if (node.nodeType === 3) {
            let nodeLen = (node).data.length;
            let next = cur + nodeLen;
            if (next > start && cur < end) {
                let pos = cur >= start ? cur : start;
                let len = (next < end ? next : end) - pos;
                if (len > 0) {
                    if (!(pos === cur && len === nodeLen && node.parentNode &&
                        node.parentNode.childNodes && node.parentNode.childNodes.length === 1 &&
                        (node.parentNode).tagName === 'SPAN' && (node.parentNode).className === 'highlight1')) {

                        replacements.push({
                            node: node,
                            pos: pos - cur,
                            len: len,
                        });
                    }
                }
            }
            cur = next;
        }
        else if (node.nodeType === 1) {
            let childNodes = node.childNodes;
            if (childNodes && childNodes.length) {
                for (let i = 0; i < childNodes.length; i++) {
                    dig(childNodes[i]);
                    if (cur >= end) {
                        break;
                    }
                }
            }
        }
    }

    $(selector).each(function (index, element){
        dig(element);
    });

    let highlightedSection = [];

    for (let i = 0; i < replacements.length; i++) {
        let replacement = replacements[i];
        let highlight = document.createElement('span');
        if(isLabeled==0) { highlight.setAttribute("id", "highlight-" + counterAssociations); }
        else{ highlight.setAttribute("id", "highlight-" + currentClassification);}
        highlight.setAttribute("style", "background-color: #FFE5CC");
        let wordNode = replacement.node.splitText(replacement.pos);
        wordNode.splitText(replacement.len);
        let wordClone = wordNode.cloneNode(true);
        highlight.appendChild(wordClone);
        wordNode.parentNode.replaceChild(highlight, wordNode);
        highlightedSection.push(highlight);
    }

    unselectAll();
    return highlightedSection;
}


// function highlightCodeFromRange(range){
//     var newNode = document.createElement("span");
//     //Adding ID for the given selection that is gonna be useful when we want to remove the highlighted text
//     if(isLabeled==0) { newNode.setAttribute("id", "highlight-" + counterAssociations); }
//     else{ newNode.setAttribute("id", "highlight-" + currentClassification);}
//     newNode.setAttribute("style", "background-color: #FFE5CC");
//     newNode.appendChild(range.extractContents());
//     range.insertNode(newNode);
//     dictHighlightedCode[counterAssociations] = newNode;
//     return newNode;
// }

function moveToSelectedMethodFromTag(indexComment, indexClassification) {

    var arr = Array.from(comments);
    indexComment = indexComment.toString();
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    currentClassification = indexClassification;

     //highlight the select button category
    for(var i=0; i<dictSelectedCategories[currentClassification].length; i++){
        if(!labelCategories.includes(dictSelectedCategories[currentClassification][i])){
            //Then we have a new category defined by the tagger
            $("#new-category-button").css('background-color','green').text(dictSelectedCategories[currentClassification][i]);

        }
        $("#"+dictSelectedCategories[currentClassification][i]).css('background-color','green');
    }


    //move down to the selected method
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });

    //deactivating other classification buttons

    for (const [key, value] of Object.entries(dictSelectedCode)) {
          if (key === indexClassification){ continue; }
          else{ $('#association-'+i).attr('disabled','disabled'); }
    }


    ////////////////////////////////////////////////////
    //Highlight the selected comment

    for(var j=0;j<selectedComments.length;j++) {

        currentIndexComment = Number(j);
        // We highlight the previously made classification
        const position = dictHighlightedCommentsPosition[indexClassification][currentIndexComment];
        $(comments[position]).css('color', 'red');
        highlightedCommentsInReviewing.push(comments[position]);
        var lines = $(comments[position]).text().split('\n');
        for (var k = 0; k < lines.length; k++) {
            updateTextArea('<span class="selected-comment">' + lines[k] + '</span>');
        }

    }

    /////////////////////////////////////////////////////////////////////////////////////////////

    //Highlight the selected code
    for(var i=0;i<dictHighlightedCodeCharacterPosition[currentClassification].length;i++){

        var start = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[0]);
        var end = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[1]);

        //console.log(start);
        //console.log(end);

        if(start === 0 || end === 0){
            continue;
        }

        // semi-column heuristic to reconstruct and display the highlighted code correctly
        highlightRangeNew(start,end);
        var spanSelector = "[id=highlight-"+(currentClassification)+"]";
        var concatenedString = ''
        var previousString = ''

        for(var j=0; j < $(spanSelector).length; j++){
            concatenedString = previousString + $(spanSelector)[j].innerText;
            if(concatenedString.trim().endsWith(';') || concatenedString.trim().endsWith('}')){
                updateTextArea('<span class="selected-code">' + concatenedString + '</span>');
                previousString = '';
            }else{
                previousString = concatenedString;
            }
        }

    }

    /*for(var i=0;i<dictRangeHighlightedCode[currentClassification].length;i++){
        var deseriazedRange = rangy.deserializeRange(dictRangeHighlightedCode[currentClassification][i]);
        var newNode = document.createElement("span");

        //Adding ID for the given selection that is gonna be useful when we want to remove the highlighted text
        newNode.setAttribute("id", "highlight-" + currentClassification);
        newNode.setAttribute("style", "background-color: #FFE5CC");
        newNode.appendChild(deseriazedRange.extractContents());
        deseriazedRange.insertNode(newNode);

        var lines = newNode.textContent.split('\n');
        for (var k = 0; k < lines.length; k++) {
            updateTextArea('<span class="selected-code">' + lines[k] + '</span>');
        }

    }*/

    // var lines = newNode.textContent.split('\n');
    // for (var k = 0; k < lines.length; k++) {
    //     updateTextArea('<span class="selected-code">' + lines[k] + '</span>');
    // }

}

function highlightTargetComments(elements,className, spanOfCharPerMethod){
    var dictPosition = {}
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
             dictPosition = fakeSelection4Comment(elements[i]);
             //if(isCommentInRange(dictPosition,spanOfCharPerMethod)) { $(elements[i]).addClass(className);}
             $(elements[i]).addClass(className);

        }
    }

}

function isCommentInRange(dictPosition,spanOfCharPerMethod){

    var start,end;

    for(var i=0;i<spanOfCharPerMethod.length;i++){

        start = spanOfCharPerMethod[i].split('-')[0];
        end = spanOfCharPerMethod[i].split('-')[1];

        if(dictPosition.start >= start && dictPosition.start <= end){
            // console.log('*****************')
            // console.log(dictPosition);
            // console.log('*****************\n')
            return true;
        }
    }
    return false;
}

function fakeSelection4Comment(element){
    var codeSection = document.getElementById("code");
    var range, start, end, text;
    range = document.createRange();
    range.setStart(codeSection,0);
    range.setEnd(element,0);
    start = range.toString().length //- text.length;

    range = document.createRange();
    range.selectNode(element);
    window.getSelection().addRange(range);
    text = range.toString();
    end = start + text.length;

    return {'start':start,'end':end};

}

function getSelectionCharOffsetsWithin(element) {
    var start = 0, end = 0, text = "";
    var sel, range, priorRange, serializedRange;
    if (typeof window.getSelection != "undefined") { // Non-IE
        if (window.getSelection().toString() != "") {
            range = rangy.getSelection().getRangeAt(0);
            priorRange = range.cloneRange();
            priorRange.selectNodeContents(element);
            priorRange.setEnd(range.startContainer, range.startOffset);
            start = priorRange.toString().length;
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
        if(counterAssociations==0){
            ShowNotification('You have reviewed all the instances....Please submit the new classification','success', 500);
        }

    }else if(isLabeled==0 && save){
        var selector = "[id=highlight-"+(dictIndex)+"]";
        $(selector).css('background-color','');

        //changing highlighting for the comment and code
        changeCommentHighlighting(commentEleToHighlight, 'green', false);
        console.log('start here!');
        console.log(highlightedCodeDuringSelection);
        for(var i=0;i< highlightedCodeDuringSelection.length;i++){
            $(highlightedCodeDuringSelection[i]).css('background-color','#CCFFE5');
        }
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
    commentIndex = [];
    serializedRangeList = [];
    highlightedCommentsInReviewing = [];
    highlightedCodeDuringSelection = [];
    beginningCommentCharacterPosition = [];
    endCommentCharacterPosition = [];
    listSelectedSpanCode = [];
    listSelectedSpanComment = [];
    resetClicked = false;
    selectedCategory = "";
    selectedCodeText = "";
    selectedCommentText = "";
    selectedComments = [];
    selectedCategories = [];
    selectedCode = [];

    unselectAll();
}

function resetHighlightedCode(customList=null, targetItem){
    var item='highlight-'+targetItem;
    $(`span[id=${item}]`).css('background-color','');
}

function changeCommentHighlighting(customList, color, reset=false){
    //console.log(customList);
    if(isLabeled === 0) {
        for (var i = 0; i < customList.length; i++) {
            $(customList[i][0]).css('color', color);
        }
    }else if (isLabeled === 1){
        if(commentEleToHighlight.length==0) { commentEleToHighlight = highlightedCommentsInReviewing; }
        for(var i=0;i<commentEleToHighlight.length;i++){

            if(!reset) { $(commentEleToHighlight[i]).css('color','green'); }
            else       { $(commentEleToHighlight[i]).css('color',''); }
        }

    }
}

// function checkForButtonValidity(){
//     let textBoxVal = $("#textAreaSelectedText").val();
//     if(textBoxVal==""|| (!textBoxVal.trim().startsWith("//") && !textBoxVal.trim().startsWith("/*") && !textBoxVal.trim().startsWith('/**')  )) {
//         alert("Select a comment first!");
//         return false;
//     }
//     return true;
// }

function checkForButtonValidity(){

    var textBoxTags = $("#textAreaSelectedText").children();
    for(var i=0;i<textBoxTags.length;i++){

        if( $(textBoxTags[i]).hasClass('selected-comment')){
            //console.log('ok!');
            return true;
        }
    }
    return false;
}

function updateTextArea(textToDisplay){ $("#textAreaSelectedText").append(textToDisplay);}

//  function updateTextArea(textToDisplay){
//     var previousSelection = $("#textAreaSelectedText").val().toString();
//     if(previousSelection==""){
//         $("#textAreaSelectedText").text(textToDisplay);
//     }else{
//         $("#textAreaSelectedText").text(previousSelection + "\n" + textToDisplay);
//     }
//     var refinedText = $("#textAreaSelectedText").text().replace(/^\s*\n/gm, "");
//     $("#textAreaSelectedText").append(refinedText);
// }


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
    //checkForChangedCategory(element);
    if(element.id.toString() === "new-category-button"){
        createNewCategory();
    }
    $(element).css('background-color','green');
    selectedCategory = element.id.toString();
    if(selectedCategory === 'new-category-button'){ //save the new category
        selectedCategory = $(element).text() + '-button';
    }

    selectedCategories.push(selectedCategory);

    //selectedCommentText =  $("#textAreaSelectedText").val().toString(); //at this stage we must have only the code comment/s
    //console.log($("#textAreaSelectedText").children());
}

function realLenghtList(list){
    var refinedLength=0;
    for(var k=0; k<list.length;k++){ if(list[k].length>0){ refinedLength = refinedLength+1; } }
    return refinedLength;
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

    if (commentEleToHighlight.length > 0 ) {  dictHighlightedComments[counterAssociations] = commentEleToHighlight; }

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
            //selectedComments.push(selectedCommentText);
            //selectedCode.push(selectedCodeText);
            //dictRangeHighlightedCode[counterAssociations] = serializedRangeList;

            dictHighlightedCommentsPosition[dictIndex] = [...new Set(commentIndex)];
            dictHighlightedCodeCharacterPosition[dictIndex] = listSelectedSpanCode;
            dictHighlightedCommentsCharacterPosition[dictIndex] = listSelectedSpanComment;

            if(selectedCode.length>0) {
                dictSelectedCode[dictIndex] = selectedCode.filter(function (e) {
                    return e
                });
            }

            if(selectedComments.length>0) {
                dictSelectedComment[dictIndex] = selectedComments.filter(function (e) {
                    return e
                });
            }

            if(selectedCategories.length>0) {
                dictSelectedCategories[dictIndex] = selectedCategories.filter(function (e) {
                    return e
                });
            }

            //Add new association button
            var divID = "div-association" + '-' + dictIndex;
            var buttonID = "association" + '-' + dictIndex;
            var buttonText = "#" + dictIndex;

            //var myButton = document.getElementById(buttonID);
            // while(myButton){
            //     counterAssociations = counterAssociations + 1;
            //     divID = "div-association" + '-' + counterAssociations;
            //     buttonID = "association" + '-' + counterAssociations;
            //     buttonText = "#" + counterAssociations;
            //     myButton = document.getElementById(buttonID);
            // }


            //var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + counterAssociations + ");" +  "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-check fa-2x" style="position:sticky; left:95%;" </i></button></div>';

            var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + dictIndex + ");" + "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-trash-alt fa-2x" style="position:sticky; left:95%;" onclick="moveToSelectedMethod( '+ counterAssociations +' ); removeAssociation(\''+ divID +'\')"></i></button></div>';
            //onclick="removeAssociation(\''+ divID +'\')">

            // handling list for the reviewing part
            var moveToButton = '<div class="buttonWrapper" id="' + divID + '"><button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick=" moveToSelectedMethodFromTag([' + dictHighlightedCommentsPosition[dictIndex] + '],' +dictIndex + ');" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + ' + </button></div>';
            methodSelectionButton.push(moveToButton);

            dictIndex += 1;
            counterAssociations = counterAssociations + 1;
            $("#badgeCounter").text(counterAssociations);
            $("#lowerSide" ).append( $(newButton) );

        }

        //Bringing back the change button and remove selectionButton
        if(isLabeled==1){

            // if the reviewer didn't change anything, it will overwrite such fields
            //if (selectedCommentText.trim() !== '' && selectedCommentText.trim() !== null)  { selectedComments.push(selectedCommentText); }
            //if (selectedCodeText.trim() !== ''    && selectedCodeText.trim() !== null  )   { selectedCode.push(selectedCodeText); }
            //if (selectedCategory.trim() !== ''    && selectedCategory.trim() !== null  )   { selectedCategories.push(selectedCategory);}
            //if (serializedRangeList.length > 0)     { dictRangeHighlightedCode[currentClassification] = serializedRangeList; }
            if (commentIndex.length > 0)            { dictHighlightedCommentsPosition[currentClassification] = [...new Set(commentIndex)];  } //duplicates deletion due to mis-selection event
            if (listSelectedSpanCode.length > 0)    { dictHighlightedCodeCharacterPosition[currentClassification] = listSelectedSpanCode; }
            if (listSelectedSpanComment.length > 0) { dictHighlightedCommentsCharacterPosition[currentClassification] = listSelectedSpanComment; }
            if (selectedCode.length > 0)            { dictSelectedCode[currentClassification] = selectedCode;        dictSelectedCode[currentClassification] = dictSelectedCode[currentClassification].filter(function(e){return e}); }
            if (selectedComments.length > 0 )       { dictSelectedComment[currentClassification] = selectedComments; dictSelectedComment[currentClassification] = dictSelectedComment[currentClassification].filter(function(e){return e});}
            if (selectedCategories.length > 0)      { dictSelectedCategories[currentClassification] = [...new Set(selectedCategories)]; dictSelectedCategories[currentClassification] = dictSelectedCategories[currentClassification].filter(function(e){return e}); }

            $("#clearText").text('Change');


            //fix here
            var flagNext =false;
            for (const [key, value] of Object.entries(dictSelectedCode)) {

                if( Number(key) === currentClassification){ flagNext = true; continue; }
                if(flagNext){
                    $('#association-'+key).removeAttr('disabled');
                    break;
                }
            }


            // try {
            //     var flagIN = false;
            //
            //     var counter = currentClassification + 1;
            //     var extractedItemToMatch = dictHighlightedCommentsPosition[counter];
            //
            //     while (extractedItemToMatch.length === 0) {
            //         counter = counter + 1;
            //         extractedItemToMatch = dictHighlightedCommentsPosition[counter];
            //         flagIN = true;
            //     }
            //     $('#association-' + counter).removeAttr('disabled');
            //
            // }catch(e){
            //     $('#association-' + currentClassification).removeAttr('disabled');
            // }


            flagSwitch=false;
            counterAssociations = counterAssociations - 1;
            $("#badgeCounter").text(counterAssociations);
        }

        reset(save=true);
    }

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


function removeAssociation(divID){
    targetAssociation = divID.split('-')[2];
    $('#'+divID).fadeOut(300, function(){ $(this).remove();});
    counterAssociations = counterAssociations -1;
    $("#badgeCounter").text(counterAssociations);

    //removing highlighting for code and comment
    resetHighlightedCode($(dictHighlightedCode[targetAssociation]),targetAssociation);
    if(commentEleToHighlight.length === 0){
        //console.log(dictHighlightedComments);
        changeCommentHighlighting(dictHighlightedComments[targetAssociation], '');
    }else{
        //console.log(commentEleToHighlight);
        changeCommentHighlighting(commentEleToHighlight, '');
    }

    //dictRangeHighlightedCode[targetAssociation] = [];
    dictHighlightedCommentsPosition[targetAssociation] = [];
    dictHighlightedCodeCharacterPosition[targetAssociation] = [];
    dictSelectedCode[targetAssociation] = [];
    dictSelectedCategories[targetAssociation] = [];
    dictSelectedComment[targetAssociation] = [];
    methodSelectionButton[targetAssociation] = '';
    selectedComments = [];
    selectedCategories = [];
    selectedCode = [];
}

function cleanDict(obj) {
  for (var propName in obj) {
    if (obj[propName].length === 0 || obj[propName] === undefined) {
      delete obj[propName];
    }
  }
  return obj
}

