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



function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function ChangeSkipToNext() {
    $("#next-skip-btn").text("Next");
    $("#next-skip-btn").removeClass("btn-outline-success");
    $("#next-skip-btn").addClass("btn-success");
    window.location.pathname = '/labeling';
}


function createNewCategory() {
    var newCategoryName = prompt("Please type the new comment category name","Text");
    var newCategoryDescription =  prompt("Please type the new comment category description","");
    if (newCategoryDescription === null || newCategoryName === null || newCategoryDescription === "" || newCategoryName === "") {
        var tag = document.createElement("div");
        //console.log(buttonID);
        tag.setAttribute('class','alert alert-danger alert-fixed');
        tag.setAttribute('role','alert');
        tag.setAttribute('id','alertCategory')
        tag.setAttribute('style','font-size:large; text-align:center;');
        tag.innerText = 'Both fields must be filled!';

        try{
            $("#alertCategory").remove()
        }catch (ex){}

        $('#alert').append(tag);
        $('#alertCategory').fadeIn(1000);
           setTimeout(function() {
               $('#alertCategory').fadeOut(1000);
               }, 2000);

        return;
    }
    //var buttonID = dictRes['category_name'].replace(/\s/g, '');+'-button';
    userDefinedNewCategoryNames.push(newCategoryName);
    userDefinedNewCategoryDescriptions.push(newCategoryDescription);
    return {'category_name':newCategoryName,'description':newCategoryDescription};

}



function moveToSelectedMethod(indexClassification, onlyAnimation=true){

    var arr = Array.from(comments);
    indexComment = dictHighlightedCommentsPosition[indexClassification].toString();
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });


    if(!onlyAnimation) {
        resetColorHighlightingCategories();
        highlightSelectedCategoryButton(indexClassification);
        setTimeout(function () {
            resetColorHighlightingCategories();
        }, 1500); //in millisecond
    }

}

function moveToSelectedMethodFromLine(lineNumber){
    var tagSelector = $(`.row-line:contains(${lineNumber})`);
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(5000).queue(function () {
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
        if(isLabeled==0) { highlight.setAttribute("id", "highlight-" + dictIndex); }
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

function moveToSelectedMethodFromTag(indexComment, indexClassification) {

    //unlock code section
    $("#code").css('user-select','');

    //activate the previously disabled save and clear button
    $("#saveClassification").removeAttr('disabled');
    $("#clearText").removeAttr('disabled');

    if ($("#clearText").text().trim() === 'Reset'){
        $("#clearText").text('Change');
    }

    var arr = Array.from(comments);
    indexComment = indexComment.toString();
    var selectedComments = indexComment.split(',');
    var tagSelector = arr[selectedComments[0]];
    currentClassification = indexClassification;

    highlightSelectedCategoryButton(currentClassification);

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
        $(comments[position]).css('color', 'red').attr('id','comment-highlight-'+currentClassification);
        highlightedCommentsInReviewing.push(comments[position]);
        var lines = $(comments[position]).text().split('\n');
        for (var k = 0; k < lines.length; k++) {
            updateTextArea('<span class="selected-comment">' + escapeHtml(lines[k]) + '</span>');
        }

    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //Highlight the selected code
    for(var i=0;i<dictHighlightedCodeCharacterPosition[currentClassification].length;i++) {

        var start = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[0]);
        var end = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[1]);


        if (start === 0 || end === 0) {
            continue;
        }

        highlightRangeNew(start, end);
    }


    // semi-column heuristic to reconstruct and display the highlighted code correctly


    var spanSelector = "[id=highlight-"+(currentClassification)+"]";
    var concatenedString = ''
    var previousString = ''

    // we should find a nice way to highlight the selected text
    for(var j=0; j < $(spanSelector).length; j++) {
        concatenedString = concatenedString + $(spanSelector)[j].innerText;
    }
    updateTextArea('<span class="selected-code">' +escapeHtml(concatenedString) + '</span>');

}

function highlightTargetComments(elements,className){
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
        //changeCommentHighlighting(commentEleToHighlight,'', true);
        if(isLabeled==0){
            var spanSelector = "[id=comment-highlight-" + (dictIndex) + "]";
            $(spanSelector).css('color', '');
            resetHighlightedCode(dictHighlightedCode[dictIndex], dictIndex);
        }

        if(isLabeled==1){
            //reset comment
            var spanSelector = "[id=comment-highlight-" + (currentClassification) + "]";
            $(spanSelector).css('color', '');

            //reset code
            spanSelector = "[id=highlight-"+(currentClassification)+"]";
            $(spanSelector).css('background-color','').attr("id","old-span");

        }

        /*if(userDefinedNewCategoryNames.length>=1) {
            userDefinedNewCategoryDescriptions.pop();
            userDefinedNewCategoryNames.pop();
        }*/
    }

    if(isLabeled==1 && save){

        //Disable Save and Reset button until the user click on the first association
        $("#saveClassification").attr('disabled','disabled');
        $("#clearText").attr('disabled','disabled');


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

    //removing #new-category-button2 if exists
    try{ $( document.getElementById("new-category-button2").parentElement).remove();}
    catch(ex){}

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

function updateTextArea(textToDisplay){
    $("#textAreaSelectedText").append(textToDisplay);
}

function removeNewAddedCategory(element){

    onMouseLeaveEvent(element);

    var keys = Object.keys(dictSelectedCategories);
    var skip=false;

    keys.forEach(function(key){
        if(dictSelectedCategories[key].includes(element)){
            alert('This action is forbidden. Please remove first the association you made!');
            skip=true;
        }
    });

    if(!skip) {
        $("#" + element)[0].parentNode.remove();
        var index = selectedCategories.indexOf(element);
        selectedCategories[index] = null;
        userDefinedNewCategoryNames.reverse().pop();
        userDefinedNewCategoryDescriptions.reverse().pop();
    }

    // console.log('**************************');
    // console.log(userDefinedNewCategoryNames);
    // console.log(userDefinedNewCategoryDescriptions);
    // console.log('**************************');

}

function addNewCommentToBeLinked(element){

    var retCode=checkForButtonValidity();
    if (!retCode) { return false;}
    
    if(element.id.toString() === "new-category-button") {
        var dictRes = createNewCategory();

        var tag = document.createElement("div");
        var buttonID = (dictRes['category_name'].split(' ').join(''))+'-button';
        tag.setAttribute('onmouseenter','onMouseEnterEvent("' + buttonID + '","' + dictRes['description'] + '");');
        tag.setAttribute('onmouseleave','onMouseLeaveEvent("' + buttonID + '" );');
        tag.setAttribute('class', 'buttonWrapper');

        var newButton = document.createElement('button');
        newButton.setAttribute('class', 'btn btn btn-dark category-button')
        newButton.setAttribute('type', 'submit');
        newButton.setAttribute('id', buttonID);
        newButton.setAttribute('style', 'width: 100%;');
        newButton.innerText = dictRes['category_name'];

        var newTrashButton =  document.createElement('i');
        newTrashButton.setAttribute('class','far fa-trash-alt fa-1x');
        newTrashButton.setAttribute('style','position:sticky; left:95%;');
        newTrashButton.setAttribute('onclick','removeNewAddedCategory("' + buttonID +'");');

        newButton.appendChild(newTrashButton);
        tag.appendChild(newButton);
        $("#categoriesColumn").append(tag);
        selectedCategory = buttonID;
        $(newButton).css('background-color','green');

    }else{
        $(element).css('background-color','green');
        selectedCategory = element.id.toString();
    }

    selectedCategories.push(selectedCategory);
}



function isSelectedCategory(){
    if(selectedCategory=="" && isLabeled==0 && selectedCategory != 'comment'){ //we accept commented code without any code snippet associated
        console.log(selectedCategory);
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
        var flag=false;
        var childNodes = document.getElementById("textAreaSelectedText").childNodes;
        for(var i = 0; i < childNodes.length; i++){
            if( $(childNodes[i])[0].className === "selected-code"){
                flag=true;
                break;
            }
        }
        if(!flag){
            alert("First link the given comment to the snippet!");
            return false;
        }

        $("#textAreaSelectedText").text("");
        for(var i=0;i<labelCategories.length;i++){
            var selector="#"+labelCategories[i];
            $(selector).css('background-color','');
        }

        if(isLabeled === 0) {

            //adding tag result to the lists we store in the DB

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
            var buttonText = "Association: #" + dictIndex;

            //var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + dictIndex + ");" +  "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-check fa-2x" style="position:sticky; left:95%;" </i></button></div>';

            var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + dictIndex + ", " + false + ");" + "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-trash-alt fa-2x" style="position:sticky; left:95%;" onclick="moveToSelectedMethod( '+ dictIndex +', ' + true + ' ); removeAssociation(\''+ divID +'\')"></i></button></div>';
            //onclick="removeAssociation(\''+ divID +'\')">

            // handling list for the reviewing part
            var moveToButton = '<div class="buttonWrapper" id="' + divID + '"><button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick=" moveToSelectedMethodFromTag([' + dictHighlightedCommentsPosition[dictIndex] + '],' +dictIndex + ');" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '</button></div>';
            methodSelectionButton.push(moveToButton);

            dictIndex += 1;
            counterAssociations = counterAssociations + 1;
            $("#badgeCounter").text(counterAssociations);
            $("#lowerSide" ).append( $(newButton) );

        }

        //Bringing back the change button and remove selectionButton
        if(isLabeled==1 && currentClassification>=0){

            // if the reviewer didn't change anything, it will overwrite such fields
            //if (selectedCommentText.trim() !== '' && selectedCommentText.trim() !== null)  { selectedComments.push(selectedCommentText); }
            //if (selectedCodeText.trim() !== ''    && selectedCodeText.trim() !== null  )   { selectedCode.push(selectedCodeText); }
            //if (selectedCategory.trim() !== ''    && selectedCategory.trim() !== null  )   { selectedCategories.push(selectedCategory);}
            //if (serializedRangeList.length > 0)     { dictRangeHighlightedCode[currentClassification] = serializedRangeList; }
            if (commentIndex.length > 0)            { dictHighlightedCommentsPosition[currentClassification] = [...new Set(commentIndex)];  } //duplicates deletion due to mis-selection event
            if (listSelectedSpanCode.length > 0)    { dictHighlightedCodeCharacterPosition[currentClassification] = listSelectedSpanCode; }
            if (listSelectedSpanComment.length > 0) { dictHighlightedCommentsCharacterPosition[currentClassification] = listSelectedSpanComment; }
            if (selectedCode.length > 0)            { dictSelectedCode[currentClassification] = selectedCode.filter(function(e){return e}); }
            if (selectedComments.length > 0 )       { dictSelectedComment[currentClassification] = selectedComments.filter(function(e){return e}); }
            if (selectedCategories.length > 0)      { dictSelectedCategories[currentClassification] = [...new Set(selectedCategories)]; dictSelectedCategories[currentClassification] = dictSelectedCategories[currentClassification].filter(function(e){return e}); }

            $("#clearText").text('Change');


            var flagNext =false;
            for (const [key, value] of Object.entries(dictSelectedCode)) {

                if( Number(key) === currentClassification){ flagNext = true; continue; }
                if(flagNext){
                    $('#association-'+key).removeAttr('disabled');
                    break;
                }
            }


            flagSwitch=false;
            counterAssociations = counterAssociations - 1;
            $("#badgeCounter").text(counterAssociations);

            //lock code section
            $("#code").css('user-select','none');

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
    var spanSelector = "[id=comment-highlight-"+(targetAssociation)+"]";
    $(spanSelector).css('color','');

    resetColorHighlightingCategories();

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
    if (obj[propName].length === 0 || obj[propName] === undefined || obj[propName] === null) {
      delete obj[propName];
    }
  }
  return obj
}

function getSameKeysDict(dict1, dict2){
    var newRefinedDict = {}
    for (const [key1, value1] of Object.entries(dict1)) {
        for (const [key2, value2] of Object.entries(dict2)) {
            if(key1 === key2){
                newRefinedDict[key2]=value2;
                break;
            }
        }
    }
    return newRefinedDict;
}


function resetColorHighlightingCategories(){
    //removing categories highlighting
    var elements = document.getElementsByClassName("buttonWrapper");
    for(var i=0;i<elements.length;i++){
        if ( $(elements[i].childNodes[1]).hasClass('category-button')){ $(elements[i].childNodes[1]).css('background-color','');}
        if ( $(elements[i].childNodes[0]).hasClass('category-button') ) {  $(elements[i].childNodes[0]).css('background-color','');}
    }
}

function highlightSelectedCategoryButton(index){
    //highlight the select button category
    for(var i=0; i<dictSelectedCategories[index].length; i++){
        $("#"+dictSelectedCategories[index][i]).css('background-color','green');
    }
}

function onMouseEnterEvent(category,description){
    category = category.split('-')[0];
    var myDiv = document.createElement('div');
    myDiv.setAttribute('class', 'popUpCategory');
    myDiv.setAttribute('id', "pop-up-"+category);
    myDiv.innerHTML = description;
    document.body.appendChild(myDiv);
}

function onMouseLeaveEvent(btnCategory){
    var category = btnCategory.split('-')[0];
    $("#pop-up-"+category).remove();
}