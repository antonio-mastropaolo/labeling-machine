from flask import render_template, request, redirect, url_for, jsonify
from src.helper.tools_labeling import *
from src.helper.tools_common import is_signed_in, lock_artifact_by
from src import app
from src.database.models import Note
from src.helper.consts import *
import json
from pygments.lexers.jvm import *


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
                    N_API_NEEDS_LABELING)
            else:
                selected_artifact_id = choose_next_random_api()
                print('Random selected artifact: {}'.format(selected_artifact_id))
                if selected_artifact_id < 0:
                    return "It seems you are done. Please Wait for others [Code: {}]".format(selected_artifact_id)
                return redirect(url_for('labeling_with_artifact', target_artifact_id=selected_artifact_id))
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
                           LabelingData.query.with_entities(LabelingData.username_tagger).filter_by(
                               artifact_id=target_artifact_id).all()}

            lock_artifact_by(who_is_signed_in(), target_artifact_id)

            with open(artifact_data.linkToFileJava) as f:
                javaClassText = f.read()

            counterAssociations = artifact_data.counterAssociations

            spanListMethods = eval(artifact_data.methodsListLines)
            methodsName = eval(artifact_data.methodsName)

            isLabeled = 1 if artifact_data.labeled == 1 else 0
            isReviewed = 1 if artifact_data.reviewed == 1 else 0

            commentPositionList = []
            rangeHighlightedCodeRev = []
            moveSelectionButtonList = []
            selectedCategories = []
            selectedCode = []
            selectedComments = []
            codeSpan = []
            commentSpan = []

            if (isLabeled == 1):
                artifact_label = LabelingData.query.filter_by(artifact_id=target_artifact_id).first()
                commentPositionList = eval(artifact_label.commentPosition)
                rangeHighlightedCodeRev = artifact_label.rangeSelectedText
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
                                   artifact_id=target_artifact_id,
                                   artifact_data=artifact_data,
                                   artifact_class=javaClassText,
                                   artifact_methodsListLines=spanListMethods,
                                   artifact_label_commentPositionList=commentPositionList,
                                   artifact_label_rangeSelectedText=rangeHighlightedCodeRev,
                                   artifact_moveSelectionButtonList=moveSelectionButtonList,
                                   isLabeled=isLabeled,
                                   isReviewed=isReviewed,
                                   artificat_methodsName=methodsName,
                                   artificat_lines=linesList,
                                   counterAssociations=counterAssociations,
                                   overall_labeling_status=get_overall_labeling_progress(),
                                   user_info=get_labeling_status(who_is_signed_in()),
                                   artifact_linesString=linesMethodsString,
                                   artificat_label_categories=selectedCategories,
                                   selectedCode=selectedCode,
                                   selectedComments=selectedComments,
                                   codeSpan=codeSpan,
                                   commentSpan=commentSpan,
                                   # existing_labeling_data=all_labels,
                                   all_taggers=', '.join(all_taggers) if all_taggers is not None else None
                                   )
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"


@app.route("/note", methods=['GET', 'POST'])
def note():
    if CURRENT_TASK['level'] != 0:  # We are not at Labeling phase anymore.
        return jsonify('{{ "error": "We are not labeling. Labeling data is in read-only mode." }}')

    if request.method == 'POST':
        artifact_id = request.form['artifact_id']
        note_text = request.form['note']
        action = request.form['action']

        n = len(Note.query.filter_by(artifact_id=artifact_id).filter_by(note=note_text).all())
        my_note_report_on_artifact = Note.query.filter_by(artifact_id=artifact_id).filter_by(note=note_text).filter_by(
            added_by=who_is_signed_in()).first()
        if my_note_report_on_artifact is None:
            status = "false"
        else:
            status = "true"

        if action == 'status':
            return jsonify('{{ "error": "", "{}_new_status": {}, "total": {} }}'.format(note_text, status, n))
        if action == 'toggle':
            if my_note_report_on_artifact is None:
                noteedPost = Note(artifact_id=artifact_id, note=note_text, added_by=who_is_signed_in())
                db.session.add(noteedPost)
                db.session.commit()
                n += 1
                status = "true"
            else:
                db.session.delete(my_note_report_on_artifact)
                db.session.commit()
                n -= 1
                status = "false"
            return jsonify('{{ "error": "", "{}_new_status": {}, "total": {} }}'.format(note_text, status, n))
        else:
            return jsonify('{{ "error": "Bad Request: {}" }}'.format(action))
    else:
        return "Not POST!"


@app.route("/flag_artifact", methods=['GET', 'POST'])
def toggle_fp():
    if CURRENT_TASK['level'] != 0:  # We are not at Labeling phase anymore.
        return jsonify('{{ "error": "We are not labeling. Labeling data is in read-only mode." }}')

    if request.method == 'POST':
        artifact_id = request.form['artifact_id']
        action = request.form['action']

        n_flaggers = len(FlaggedArtifact.query.filter_by(artifact_id=artifact_id).all())
        my_flag_report_on_artifact = FlaggedArtifact.query.filter_by(artifact_id=artifact_id).filter_by(
            added_by=who_is_signed_in()).first()

        if my_flag_report_on_artifact is None:
            status = "false"
        else:
            status = "true"

        if action == 'status':
            return jsonify('{{ "error": "", "new_status": {}, "nFP": {} }}'.format(status, n_flaggers))
        if action == 'toggle':
            if my_flag_report_on_artifact is None:
                new_fp_report = FlaggedArtifact(artifact_id=artifact_id, added_by=who_is_signed_in())
                db.session.add(new_fp_report)
                db.session.commit()
                n_flaggers += 1
                status = "true"
            else:
                db.session.delete(my_flag_report_on_artifact)
                db.session.commit()
                n_flaggers -= 1
                status = "false"
            return jsonify('{{ "error": "", "new_status": {}, "nFP": {} }}'.format(status, n_flaggers))
        else:
            return jsonify('{{ "error": "Bad Request: {}" }}'.format(action))

    else:
        return "Not POST!"


@app.route("/label", methods=['GET', 'POST'])
def label():
    if CURRENT_TASK['level'] != 0:  # We are not at Labeling phase anymore.
        return jsonify('{ "error": "We are not labeling. Labeling data is in read-only mode." }')

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
        rangeSelectedText = request.form['rangeSelectedText']
        commentPosition = request.form['commentPosition']
        moveSelectionButton = request.form['moveToSelectedButtons']
        counterAssociations = request.form['counterAssociations']

        if int(workingMode) == 0:
            isLabeled = 1
            isReviewed = 0

        else:
            isLabeled = 1
            isReviewed = 1


        if(int(workingMode)==0):
            jr = LabelingData(artifact_id=artifact_id, username_tagger=who_is_signed_in(),
                                  duration_sec=duration_sec, code=code, comments=comments, codeSpan=codeSpan,
                                  commentSpan=commentSpan, categories=categories, commentPosition=commentPosition,
                                  rangeSelectedText=rangeSelectedText, moveSelectionButton=moveSelectionButton
                              )

            db.session.add(jr)
            db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
            db.session.commit()

        else:
            labeling_data = LabelingData.query.filter_by(artifact_id=artifact_id).first()
            labeling_data.comments = comments
            labeling_data.username_reviewer = who_is_signed_in()
            labeling_data.commentPosition = commentPosition
            labeling_data.moveSelectionButton = moveSelectionButton
            labeling_data.rangeSelectedText = rangeSelectedText
            labeling_data.code = code
            labeling_data.codeSpan = codeSpan
            labeling_data.commentSpan = commentSpan
            labeling_data.categories = categories
            db.session.commit()

        artifact = Artifact.query.filter_by(id=artifact_id).first()
        artifact.labeled = isLabeled
        artifact.reviewed = isReviewed
        artifact.counterAssociations = counterAssociations
        db.session.commit()

        return jsonify('{ "status": "success" }')

