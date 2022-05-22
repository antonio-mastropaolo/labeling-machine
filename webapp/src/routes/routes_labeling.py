import datetime
import sys

from flask import render_template, request, redirect, url_for, jsonify, session
from src.database.models import LabelingDataLabeler, LabelingDataReviewer, LabelingDataNoConflicts, Artifact, UserDefinedCategory, Conflict, FlaggedArtifact
from src.helper.tools_labeling import *
from src.helper.tools_common import is_signed_in, lock_artifact_by
from src import app
from src.helper.consts import *
import json, re
from dict_hash import dict_hash
import time


@app.route("/labeling", methods=['GET', 'POST'])
def labeling():
    if request.method != 'POST':
        if is_signed_in():
            # This is not fully correct! because maybe tagger A label N needed artifacts,
            # but since #tagged_by_two is less than two, app still propose artifacts to guy A
            n_classes = get_total_number_of_classes_in_db()
            n_classes_reviewed = get_total_number_of_reviewed_classes()
            if n_classes_reviewed == n_classes:
                return "We are done. All {} Classes are tagged and eventual conflicts have been resolved".format(
                    n_classes)
            else:
                selected_artifact_id = choose_next_random_api()
                #print('Random selected artifact: {}'.format(selected_artifact_id))
                if selected_artifact_id < 0:
                    return "It seems you are done. Please Wait for others [Code: {}]".format(selected_artifact_id)
                return redirect(url_for('labeling_with_artifact', target_artifact_id=selected_artifact_id))
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"

@app.route("/conflicting", methods=['GET', 'POST'])
def conflicting():
    if request.method != 'POST':
        if is_signed_in():
            (selected_artifact_id, instanceObject) = choose_next_instance_to_be_solved()
            #print('Att: ',selected_artifact_id)
            if selected_artifact_id is None and instanceObject == []:
                return "It seems no more conflicts can be solved on your side. Well Done!"
            else:
                return redirect(url_for('conflicting_with_artifact', target_artifact_id=selected_artifact_id))
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"

@app.route("/conflicting/<target_artifact_id>", methods=['GET', 'POST'])
def conflicting_with_artifact(target_artifact_id):
    if not IS_SYSTEM_UP:
        return SYSTEM_STATUS_MESSAGE

    if request.method != 'POST':
        if is_signed_in():
            artifact_data = Artifact.query.filter_by(id=target_artifact_id).first()
            all_taggers = {row[0] for row in
                           LabelingDataLabeler.query.with_entities(LabelingDataLabeler.username).filter_by(
                               artifact_id=target_artifact_id).all()}


            target_artifact_id = int(target_artifact_id)
            labeler_classification = LabelingDataLabeler.query.filter_by(artifact_id=target_artifact_id).first()
            reviewer_classification = LabelingDataReviewer.query.filter_by(artifact_id=target_artifact_id).first()
            #Add conflicts object to conflictList
            conflictList = []
            conflicts = {}

            to_be_updated_true_conflicts = []
            to_be_updated_false_conflicts = []

            for q in db.session.query(Conflict).filter(Conflict.artifact_id == target_artifact_id).all():

                isAConflictOnCategory = 0
                isAConflictOnCode = 0
                isAConflictOnComment = 0

                newObject = {'classification': q.__dict__['classification'],
                             'conflict_categories': q.__dict__['conflict_categories'],
                             'conflict_code': q.__dict__['conflict_code'],
                             'conflict_comment': q.__dict__['conflict_comment']
                             }

                # //////////////////////////////////////////////////////
                if q.__dict__['conflict_categories'] == 1:
                    isAConflictOnCategory = 1

                # //////////////////////////////////////////////////////

                # we make sure of the conflicts on the code since [-1] created troubles.
                cls = q.__dict__['classification']

                rev_code = eval(reviewer_classification.__dict__['code'])[str(cls)]
                lab_code = eval(labeler_classification.__dict__['code'])[str(cls)]
                rev_selection = ''
                for item in rev_code:
                    rev_selection += ''.join(str(item).split())

                lab_selection = ''
                for item in lab_code:
                    lab_selection += ''.join(str(item).split())

                if q.__dict__['conflict_code'] == 1:
                    if rev_selection == lab_selection:
                        isAConflictOnCode = 1
                    else:
                        to_be_updated_false_conflicts.append(q.__dict__['conflict_id'])
                        isAConflictOnCode = 0
                else:
                    if rev_selection != lab_selection:
                        to_be_updated_true_conflicts.append(q.__dict__['conflict_id'])
                        isAConflictOnCode = 1

                # //////////////////////////////////////////////////////

                if  q.__dict__['conflict_comment'] == 1:
                    isAConflictOnComment = 1

                # //////////////////////////////////////////////////////


                conflicts[q.__dict__['classification']] = {"conflict_categories":isAConflictOnCategory, "conflict_code":isAConflictOnCode, "conflict_comment":isAConflictOnComment};

                if isAConflictOnCategory or isAConflictOnCode or isAConflictOnComment:
                    conflictList.append(newObject)


            # Preparing dictionaries to be returned to the html page
            rev_commentPositionList = {}
            rev_selectedCategories = {}
            rev_selectedCode = {}
            rev_selectedComments ={}
            rev_codeSpan = {}
            rev_commentSpan = {}

            lab_commentPositionList = {}
            lab_moveSelectionButtonList = {}
            lab_selectedCategories = {}
            lab_selectedCode = {}
            lab_selectedComments = {}
            lab_codeSpan = {}
            lab_commentSpan = {}

            moveSelectionButtonList = eval(labeler_classification.__dict__['moveSelectionButton'])

            for conflictItem in conflictList:
                classification = str(conflictItem['classification'])
                rev_commentPositionList[classification] = eval(reviewer_classification.__dict__['commentPosition'])[classification]
                rev_codeSpan[classification] = eval(reviewer_classification.__dict__['codeSpan'])[classification]
                rev_selectedComments[classification] = eval(reviewer_classification.__dict__['comments'])[classification]
                rev_commentSpan[classification] = eval(reviewer_classification.__dict__['commentSpan'])[classification]
                rev_selectedCode[classification] = eval(reviewer_classification.__dict__['code'])[classification]

                # handling emad's problem with the category selection
                try:
                    rev_selectedCategories[classification] = eval(reviewer_classification.__dict__['categories'])[classification]
                except Exception:
                    rev_selectedCategories[classification] = eval(labeler_classification.__dict__['categories'])[classification]

                lab_commentPositionList[classification] = eval(labeler_classification.__dict__['commentPosition'])[classification]
                lab_codeSpan[classification] = eval(labeler_classification.__dict__['codeSpan'])[classification]
                lab_selectedComments[classification] = eval(labeler_classification.__dict__['comments'])[classification]
                lab_commentSpan[classification] = eval(labeler_classification.__dict__['commentSpan'])[classification]
                lab_selectedCode[classification] = eval(labeler_classification.__dict__['code'])[classification]

                # handling emad's problem with the category selection
                try:
                    lab_selectedCategories[classification] = eval(labeler_classification.__dict__['categories'])[classification]
                except Exception:
                    lab_selectedCategories[classification] = eval(reviewer_classification.__dict__['categories'])[classification]

            # here we fix the Conflict Table if needed

            # update conflict
            flagUpdate = False
            for itemToBeUpdate in to_be_updated_true_conflicts:
                db.session.query(Conflict). \
                    filter(Conflict.conflict_id == itemToBeUpdate). \
                    update({'conflict_code': 1})
                flagUpdate = True
                db.session.flush()

            # update conflict
            for itemToBeUpdate in to_be_updated_false_conflicts:
                db.session.query(Conflict). \
                    filter(Conflict.conflict_id == itemToBeUpdate). \
                    update({'conflict_code': 0})
                flagUpdate = True
                db.session.flush()

            if flagUpdate:
                db.session.commit()


            #################### the dictionaries are filled ####################

            # print(moveSelectionButtonList)
            # print(rev_codeSpan)
            # print(lab_codeSpan)
            # print(lab_selectedCategories)
            # print(rev_selectedCategories)

            udc = UserDefinedCategory.query.all()
            listNameCategory = []
            listDescriptionCategory = []
            listID = []
            listCategoryButton = []
            listShortcuts = []

            for row in udc:
                listNameCategory.append(row.categoryName)
                listDescriptionCategory.append(row.description)
                listID.append(row.category_id)
                listCategoryButton.append(row.categoryButtonName)
                listShortcuts.append(row.shortcut)

            udc_item = {'category_id': listID,
                        'category_name': listNameCategory,
                        'description': listDescriptionCategory,
                        'category_button_name': listCategoryButton,
                        'shortcut': listShortcuts
                        }

            lock_artifact_by(who_is_signed_in(), target_artifact_id)
#
            spanListMethods = eval(artifact_data.methodsListLines)
            methodsName = eval(artifact_data.methodsName)
            numberOfCommentsPerMethod = eval(artifact_data.methodsComments)

#
#
#             #this one works only on bar
            if sys.platform=='linux':
                newLinkToFileJava = '/labeling-machine/data/' + '/'.join(artifact_data.linkToFileJava.split('/')[4:])
            else:
                #Locally on antonio's machine
                newLinkToFileJava = '/Users/antonio/Desktop/' +'/'.join(artifact_data.linkToFileJava.split('/')[3:])

            with open(newLinkToFileJava) as f:
                javaClassText = f.read()

            # Adding character ranges for each method
            methodsRanges = []
            for mLine in spanListMethods:

                start = int(mLine.split('-')[0])
                end = int(mLine.split('-')[1])

                with open(newLinkToFileJava, encoding='utf-8') as f:

                    cumLines = ''
                    fromBeginning = ''
                    flagBeginning = False

                    for (index, line) in enumerate(f):
                        if (index == start - 1):
                            cumLines += line
                            flagBeginning = True

                        elif (index == end - 1):
                            cumLines += line
                            break

                        elif not flagBeginning:
                            fromBeginning += line

                        else:
                            cumLines += line

                beginningToEnd = fromBeginning + cumLines

                offset_start = len(fromBeginning.encode('utf-8')) + 4
                offset_end = len(beginningToEnd.encode('utf-8'))

                methodsRanges.append( '{}-{}'.format(offset_start, offset_end))


            counterAssociations = len(rev_commentSpan.keys())


            linesList = []
            linesMethodsString = ''

            for (line_index, line) in enumerate(javaClassText.splitlines()):
                linesList.append(line_index)
                linesMethodsString += '{}\n'.format(line_index)

            return render_template('labeling_pages/artifact_conflict.html',
                                   artifact_id = target_artifact_id,
                                   artifact_data = artifact_data,
                                   artifact_class = javaClassText,
                                   artifact_UDC = udc_item,
                                   artifact_methodsRanges = methodsRanges,
                                   artifact_methodsListLines = spanListMethods,
                                   artifact_commentsPerMethod = numberOfCommentsPerMethod,
                                   artifact_labeler_commentPositionList = lab_commentPositionList,
                                   artifact_labeler_moveSelectionButtonList = lab_moveSelectionButtonList,
                                   artifact_reviewer_commentPositionList = rev_commentPositionList,
                                   artifact_moveSelectionButtonList = moveSelectionButtonList,
                                   artifact_methodsName = methodsName,
                                   artifact_lines = linesList,
                                   conflicts_result = conflicts,
                                   counterAssociations = counterAssociations,
                                   overall_conflicting_status = get_overall_conflicting_progress(),
                                   user_info = get_labeling_status(who_is_signed_in()),
                                   artifact_linesString = linesMethodsString,
                                   artificat_labeler_categories = lab_selectedCategories,
                                   selectedCodeLabeler = lab_selectedCode,
                                   selectedCommentsLabeler = lab_selectedComments,
                                   codeSpanLabeler = lab_codeSpan,
                                   commentSpanLabeler = lab_commentSpan,
                                   artificat_reviewer_categories=rev_selectedCategories,
                                   selectedCodeReviewer=rev_selectedCode,
                                   selectedCommentsReviewer=rev_selectedComments,
                                   codeSpanReviewer=rev_codeSpan,
                                   commentSpanReviewer=rev_commentSpan,
                                   all_taggers = ', '.join(all_taggers) if all_taggers is not None else None
                                   )
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"

@app.route("/labeling/<target_artifact_id>", methods=['GET', 'POST'])
def labeling_with_artifact(target_artifact_id):
    if not IS_SYSTEM_UP:
        return SYSTEM_STATUS_MESSAGE

    if request.method != 'POST':
        if is_signed_in():

            target_artifact_id = int(target_artifact_id)
            artifact_data = Artifact.query.filter_by(id=target_artifact_id).first()
            all_taggers = {row[0] for row in
                           LabelingDataLabeler.query.with_entities(LabelingDataLabeler.username).filter_by(
                               artifact_id=target_artifact_id).all()}

            flaggedClasses = {row[0] for row in db.session.query(FlaggedArtifact.artifact_id).all()}
            listflaggedClasses = list(flaggedClasses)

            udc = UserDefinedCategory.query.all()
            listNameCategory = []
            listDescriptionCategory = []
            listID = []
            listCategoryButton = []
            listShortcuts = []

            for row in udc:
                listNameCategory.append(row.categoryName)
                listDescriptionCategory.append(row.description)
                listID.append(row.category_id)
                listCategoryButton.append(row.categoryButtonName)
                listShortcuts.append(row.shortcut)

            udc_item = {'category_id': listID,
                        'category_name': listNameCategory,
                        'description': listDescriptionCategory,
                        'category_button_name': listCategoryButton,
                        'shortcut': listShortcuts
                        }

            lock_artifact_by(who_is_signed_in(), target_artifact_id)

            spanListMethods = eval(artifact_data.methodsListLines)
            methodsName = eval(artifact_data.methodsName)
            numberOfCommentsPerMethod = eval(artifact_data.methodsComments)
            if(sum(numberOfCommentsPerMethod)<=10):
                #print("hit")
                selected_artifact_id = choose_next_random_api()
                # print('Random selected artifact: {}'.format(selected_artifact_id))
                if selected_artifact_id < 0:
                    return "It seems you are done. Please Wait for others [Code: {}]".format(selected_artifact_id)
                return redirect(url_for('labeling_with_artifact', target_artifact_id=selected_artifact_id))
            #print("Let's have a look at this: {}".format(numberOfCommentsPerMethod))


            #this one works only on bar
            if sys.platform=='linux':
                newLinkToFileJava = '/labeling-machine/data/' + '/'.join(artifact_data.linkToFileJava.split('/')[4:])
            else:
                #Locally on antonio's machine
                newLinkToFileJava = '/Users/antonio/Desktop/' +'/'.join(artifact_data.linkToFileJava.split('/')[3:])

            with open(newLinkToFileJava) as f:
                javaClassText = f.read()

            # Adding character ranges for each method
            methodsRanges = []
            for mLine in spanListMethods:

                start = int(mLine.split('-')[0])
                end = int(mLine.split('-')[1])

                with open(newLinkToFileJava, encoding='utf-8') as f:

                    cumLines = ''
                    fromBeginning = ''
                    flagBeginning = False

                    for (index, line) in enumerate(f):
                        if (index == start - 1):
                            cumLines += line
                            flagBeginning = True

                        elif (index == end - 1):
                            cumLines += line
                            break

                        elif not flagBeginning:
                            fromBeginning += line

                        else:
                            cumLines += line

                beginningToEnd = fromBeginning + cumLines

                offset_start = len(fromBeginning.encode('utf-8')) + 4
                offset_end = len(beginningToEnd.encode('utf-8'))

                methodsRanges.append( '{}-{}'.format(offset_start, offset_end))


            counterAssociations = artifact_data.counterAssociations

            isLabeled = 1 if artifact_data.labeled == 1 else 0
            isReviewed = 1 if artifact_data.reviewed == 1 else 0

            commentPositionList = []
            #rangeHighlightedCodeRev = []
            moveSelectionButtonList = []
            selectedCategories = []
            selectedCode = []
            selectedComments = []
            codeSpan = []
            commentSpan = []

            if (isLabeled == 1):
                artifact_label = LabelingDataLabeler.query.filter_by(artifact_id=target_artifact_id).first()
                commentPositionList = eval(artifact_label.commentPosition)
                moveSelectionButtonList = eval(artifact_label.moveSelectionButton)
                selectedCategories = eval(artifact_label.categories)
                selectedCode = eval(artifact_label.code)
                selectedComments = eval(artifact_label.comments)
                codeSpan = eval(artifact_label.codeSpan)
                commentSpan = eval(artifact_label.commentSpan)


            linesList = []
            linesMethodsString = ''



            for (line_index, line) in enumerate(javaClassText.splitlines()):
                linesList.append(line_index)
                linesMethodsString += '{}\n'.format(line_index)

            return render_template('labeling_pages/artifact.html',
                                   artifact_id = target_artifact_id,
                                   artifact_data = artifact_data,
                                   artifact_class = javaClassText,
                                   artifact_UDC = udc_item,
                                   artifact_methodsRanges = methodsRanges,
                                   artifact_methodsListLines = spanListMethods,
                                   artifact_commentsPerMethod = numberOfCommentsPerMethod,
                                   artifact_label_commentPositionList = commentPositionList,
                                   artifact_moveSelectionButtonList = moveSelectionButtonList,
                                   isLabeled = isLabeled,
                                   isReviewed = isReviewed,
                                   isFlagged = 1 if target_artifact_id in listflaggedClasses else 0,
                                   artifact_methodsName = methodsName,
                                   artifact_lines = linesList,
                                   counterAssociations = counterAssociations,
                                   overall_labeling_status = get_overall_labeling_progress(),
                                   user_info = get_labeling_status(who_is_signed_in()),
                                   artifact_linesString = linesMethodsString,
                                   artificat_label_categories = selectedCategories,
                                   selectedCode = selectedCode,
                                   selectedComments = selectedComments,
                                   codeSpan = codeSpan,
                                   commentSpan = commentSpan,
                                   all_taggers = ', '.join(all_taggers) if all_taggers is not None else None
                                   )
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"


@app.route("/markBrokenClass", methods=['GET', 'POST'])
def markBrokenClass():

    if request.method == 'POST':
        if request.form['artifact_id'] == '':
            return jsonify('{ "status": "Empty arguments" }')

    try:
        artifact = Artifact.query.filter_by(id=int(request.form['artifact_id'])).first()
        artifact.isValid = 0
        db.session.commit()
    except Exception:
        print('Already Added, we do not care')

    return jsonify('{ "status": "success" }')

@app.route("/flag", methods=['GET', 'POST'])
def flagClass():

    if request.method == 'POST':
        if request.form['artifact_id'] == '':
            return jsonify('{ "status": "Empty arguments" }')

    try:
        new_fp_report = FlaggedArtifact(artifact_id=int(request.form['artifact_id']), added_by=who_is_signed_in())
        db.session.add(new_fp_report)
        db.session.commit()
    except Exception:
        print('Already Added, we do not care')

    return jsonify('{ "status": "success" }')

@app.route("/label", methods=['GET', 'POST'])
def label():

    if request.method == 'POST':
        if request.form['artifact_id'] == '' or request.form['duration'] == '':
            return jsonify('{ "status": "Empty arguments" }')

        artifact_id = int(request.form['artifact_id'])
        duration_sec = int(request.form['duration'])
        code = request.form['code']
        comments = request.form['comments']
        categories = request.form['categories']
        codeSpan = request.form['codeSpan']
        commentSpan = request.form['commentSpan']
        workingMode = request.form['workingMode']
        commentPosition = request.form['commentPosition']
        moveSelectionButton = request.form['moveToSelectedButtons']
        counterAssociations = request.form['counterAssociations']
        userDefinedNewCategoryDescriptions = eval(request.form['userDefinedNewCategoryDescriptions'])
        userDefinedNewCategoryNames = eval(request.form['userDefinedNewCategoryNames'])
        userDefinedNewCategoryShortcuts = eval(request.form['categoryShortcuts'])
        conflicts = eval(request.form['conflicts'])


        if int(workingMode) == 0:
            isLabeled = 1
            isReviewed = 0
        else:
            isLabeled = 1
            isReviewed = 1


        if int(workingMode)==0:
            labeling_data_labeler = LabelingDataLabeler(artifact_id=artifact_id, username=who_is_signed_in(),
                                  elapsed_labeling_time=duration_sec, code=code, comments=comments, codeSpan=codeSpan,
                                  commentSpan=commentSpan, categories=categories, commentPosition=commentPosition,
                                  moveSelectionButton=moveSelectionButton, labeled_at=datetime.datetime.utcnow()
                              )

            db.session.add(labeling_data_labeler)
            #db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
            #db.session.commit()

        else:
            labeling_data_reviewer = LabelingDataReviewer(artifact_id=artifact_id, username=who_is_signed_in(),
                                  elapsed_reviewing_time=duration_sec, code=code, comments=comments, codeSpan=codeSpan,
                                  commentSpan=commentSpan, categories=categories, commentPosition=commentPosition,
                                  moveSelectionButton=moveSelectionButton, reviewed_at=datetime.datetime.utcnow()
                              )

            db.session.add(labeling_data_reviewer)
            #db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
            #db.session.commit()
            for key, value in conflicts.items():
                conflictInstance = Conflict(classification=key, artifact_id=artifact_id,
                                            conflict_code=value['code'],conflict_comment=value['comment'], conflict_categories=value['categories'])
                db.session.add(conflictInstance)
                #db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952

            #db.session.commit()



        artifact = Artifact.query.filter_by(id=artifact_id).first()
        artifact.labeled = isLabeled
        artifact.reviewed = isReviewed
        artifact.counterAssociations = counterAssociations
        db.session.flush()
        db.session.commit()

        if(len(userDefinedNewCategoryDescriptions)>0):

            for (name, description, shortcut) in zip(userDefinedNewCategoryNames, userDefinedNewCategoryDescriptions, userDefinedNewCategoryShortcuts):
                buttonID = (''.join(name.split(' ')) + '-button').lower()
                udc = UserDefinedCategory(categoryName=name, description=description, categoryButtonName = buttonID, shortcut=shortcut, user=who_is_signed_in())
                db.session.add(udc)
                db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
                db.session.commit()


        return jsonify('{ "status": "success" }')

@app.route("/conflict", methods=['GET', 'POST'])
def conflict():

    if request.method == 'POST':
        if request.form['artifact_id'] == '':
            return jsonify('{ "status": "Empty arguments" }')

        artifact_id = int(request.form['artifact_id'])
        saved_resolutions = eval(request.form['solved'])


        data_labeler = db.session.query(LabelingDataLabeler).filter(LabelingDataLabeler.artifact_id==artifact_id).first()
        codeLabeler = eval(data_labeler.code)
        codeSpanLabeler = eval(data_labeler.codeSpan)
        categoriesLabeler = eval(data_labeler.categories)
        commentsLabeler = eval(data_labeler.comments)
        commentSpanLabeler = eval(data_labeler.commentSpan)

        data_reviewer = db.session.query(LabelingDataReviewer).filter(LabelingDataReviewer.artifact_id==artifact_id).first()
        codeReviewer = eval(data_reviewer.code)
        codeSpanReviewer = eval(data_reviewer.codeSpan)
        categoriesReviewer = eval(data_reviewer.categories)
        commentsReviewer = eval(data_reviewer.comments)
        commentsSpanReviewer = eval(data_reviewer.commentSpan)


        codeCopy = eval(data_labeler.code)
        codeSpanCopy = eval(data_labeler.codeSpan)
        categoriesCopy = eval(data_labeler.categories)
        commentsCopy = eval(data_labeler.comments)
        commentSpanCopy = eval(data_labeler.commentSpan)
        classificationType = {}

        isSolved = {}
        for (key,item) in saved_resolutions.items():

            whereIsTheConflict = item[1]

            #for this association the one who solved the conflict has picked the one performed by the labeler
            if item[0] == "L":

                classificationType[key]="Labeler"

                if whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 0 and whereIsTheConflict['conflict_comment'] == 0:
                    categoriesCopy[key] = categoriesLabeler[key]

                elif whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 0:
                    categoriesCopy[key] = categoriesLabeler[key]
                    codeCopy[key] = codeLabeler[key]
                    codeSpanCopy[key] = codeSpanLabeler[key]

                elif whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 1:
                    categoriesCopy[key] = categoriesLabeler[key]
                    codeCopy[key] = codeLabeler[key]
                    codeSpanCopy[key] = codeSpanLabeler[key]
                    commentsCopy = commentsLabeler[key]
                    commentSpanCopy = commentSpanLabeler[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 0:
                    codeCopy[key] = codeLabeler[key]
                    codeSpanCopy[key] = codeSpanLabeler[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 1:
                    codeCopy[key] = codeLabeler[key]
                    codeSpanCopy[key] = codeSpanLabeler[key]
                    commentsCopy[key] = commentsLabeler[key]
                    commentSpanCopy[key] = commentSpanLabeler[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 0 and whereIsTheConflict['conflict_comment'] == 1:
                    commentsCopy[key] = commentsLabeler[key]
                    commentSpanCopy[key] = commentSpanLabeler[key]

                isSolved[key] = 1

            elif item[0] == "R":
                classificationType[key] = "Reviewer"

                if whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 0 and whereIsTheConflict['conflict_comment'] == 0:
                    categoriesCopy[key] = categoriesReviewer[key]

                elif whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 0:
                    categoriesCopy[key] = categoriesReviewer[key]
                    codeCopy[key] = codeReviewer[key]
                    codeSpanCopy[key] = codeSpanReviewer[key]

                elif whereIsTheConflict['conflict_categories'] == 1 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 1:
                    categoriesCopy[key] = categoriesReviewer[key]
                    codeCopy[key] = codeReviewer[key]
                    codeSpanCopy[key] = codeSpanReviewer[key]
                    commentsCopy[key] = commentsReviewer[key]
                    commentSpanCopy[key] = commentsSpanReviewer[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 0:
                    codeCopy[key] = codeReviewer[key]
                    codeSpanCopy[key] = codeSpanReviewer[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 1 and whereIsTheConflict['conflict_comment'] == 1:
                    codeCopy[key] = codeReviewer[key]
                    codeSpanCopy[key] = codeSpanReviewer[key]
                    commentsCopy[key] = commentsReviewer[key]
                    commentSpanCopy[key] = commentsSpanReviewer[key]

                elif whereIsTheConflict['conflict_categories'] == 0 and whereIsTheConflict['conflict_code'] == 0 and whereIsTheConflict['conflict_comment'] == 1:
                    commentsCopy[key] = commentsReviewer[key]
                    commentSpanCopy[key] = commentsSpanReviewer[key]

                isSolved[key] = 1

            else:
                classificationType[key] = "Skipped"
                isSolved[key] = 0

        data = LabelingDataNoConflicts(artifact_id=artifact_id, username=who_is_signed_in(), code=str(codeCopy),
                                       codeSpan=str(codeSpanCopy), categories=str(categoriesCopy), comments=str(commentsCopy),
                                       commentSpan=str(commentSpanCopy), classificationType = str(classificationType), isSolved = str(isSolved)
                                       )
        db.session.add(data)
        #db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
        db.session.commit()





        return jsonify('{ "status": "success" }')