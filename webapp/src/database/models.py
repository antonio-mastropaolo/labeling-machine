import datetime

from sqlalchemy.orm import validates
from sqlalchemy.sql import func

from src import db


class User(db.Model):
    """
    Registered Users
    """
    __tablename__ = 'User'
    username = db.Column(db.Text, primary_key=True)
    gender = db.Column(db.Text)
    education = db.Column(db.Text)
    occupation = db.Column(db.Text)
    affiliation = db.Column(db.Text)
    years_xp = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=func.now())

    @validates('username', 'gender', 'education', 'occupation')
    def convert_lower(self, key, value):
        return value.title()


class FlaggedArtifact(db.Model):
    __tablename__ = 'FlaggedArtifact'
    artifact_id = db.Column(db.Integer, primary_key=True)
    added_by = db.Column(db.Text, primary_key=True)
    added_at = db.Column(db.DateTime, default=func.now())


class LockedArtifact(db.Model):
    __tablename__ = 'LockedArtifact'
    username = db.Column(db.Text, primary_key=True)
    artifact_id = db.Column(db.Integer)
    locked_at = db.Column(db.DateTime, default=func.now())

class UserDefinedCategory(db.Model):
    __tablename__ = 'UserDefinedCategory'
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    categoryName = db.Column(db.Text)
    description = db.Column(db.Text)
    user = db.Column(db.Text)
    categoryButtonName = db.Column(db.Text)
    shortcut = db.Column(db.Text)


class Artifact(db.Model):
    __tablename__ = 'Artifact'
    id = db.Column(db.Integer, primary_key=True)
    linkToFileJava = db.Column(db.Text)
    methodsListLines = db.Column(db.Text)
    methodsName = db.Column(db.Text)
    labeled = db.Column(db.Integer)
    reviewed = db.Column(db.Integer)
    counterAssociations = db.Column(db.Integer)
    isValid = db.Column(db.Integer)
    methodsComments = db.Column(db.Integer)

class Conflict(db.Model):
    __tablename__ = 'Conflict'
    conflict_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    artifact_id = db.Column(db.Integer)
    classification = db.Column(db.Text)
    conflict_code = db.Column(db.Integer)
    conflict_comment = db.Column(db.Integer)
    conflict_categories = db.Column(db.Integer)


class LabelingDataReviewer(db.Model):
    __tablename__ = 'LabelingDataReviewer'
    labeling_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    artifact_id = db.Column(db.Integer)
    comments = db.Column(db.Text)
    code = db.Column(db.Text)
    categories = db.Column(db.Text)
    codeSpan = db.Column(db.Text)
    commentSpan = db.Column(db.Text)
    commentPosition = db.Column(db.Text)
    moveSelectionButton = db.Column(db.Text)
    username = db.Column(db.Text)
    elapsed_reviewing_time = db.Column(db.Integer)
    reviewed_at = db.Column(db.DateTime(timezone=True))


class LabelingDataLabeler(db.Model):
    __tablename__ = 'LabelingDataLabeler'
    labeling_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    artifact_id = db.Column(db.Integer)
    comments = db.Column(db.Text)
    code = db.Column(db.Text)
    categories = db.Column(db.Text)
    codeSpan = db.Column(db.Text)
    commentSpan = db.Column(db.Text)
    commentPosition = db.Column(db.Text)
    moveSelectionButton = db.Column(db.Text)
    username = db.Column(db.Text)
    elapsed_labeling_time = db.Column(db.Integer)
    labeled_at = db.Column(db.DateTime(timezone=True))
