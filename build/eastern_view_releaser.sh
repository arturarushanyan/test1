#!/bin/sh

SKIN_NAME=$1
#BRANCH="develop"
#BRANCH="master"
MODE="local"
#MODE="remote"

if [ "$SKIN_NAME" = "" ]; then
	echo "script needs skin name to run"
	exit 255
fi

SVN_BASE_URL="svn://svn.betconstruct.int/bettingclient_html5_configs/branches"

if [ "$MODE" = "local" -a "$BRANCH" = "" ]; then
	BRANCH="develop"
fi

if [ "$2" = "release" ]; then
	BRANCH="master"
	MODE="remote"
fi

if [ "$2" = "staging" ]; then
	BRANCH="develop"
	MODE="remote"
fi


if ! svn list $SVN_BASE_URL/$BRANCH/skins/$SKIN_NAME > /dev/null 2>&1; then
	echo "skin $SKIN_NAME not available in svn branch $BRANCH"
	exit 255
fi

TMP_DIR=eastern_view

rm -rf $TMP_DIR
mkdir $TMP_DIR

SKIN_EXPORT_DIR=$SKIN_NAME

(
cd $TMP_DIR
echo "exporting skin $SKIN_NAME from branch $BRANCH"
svn export $SVN_BASE_URL/$BRANCH/skins/$SKIN_NAME > /dev/null 2>&1 && echo "skin export OK"

if which cleancss > /dev/null 2>&1; then
	CLEANCSS=`which cleancss`

	if [ -f $SKIN_EXPORT_DIR/css/index.css ]; then
		mv $SKIN_EXPORT_DIR/css/index.css $SKIN_EXPORT_DIR/css/index.css.orig
		$CLEANCSS -o $SKIN_EXPORT_DIR/css/index.css $SKIN_EXPORT_DIR/css/index.css.orig
	fi

	if [ -f $SKIN_EXPORT_DIR/css/index-embed.css ]; then
		mv $SKIN_EXPORT_DIR/css/index-embed.css $SKIN_EXPORT_DIR/css/index-embed.css.orig
		$CLEANCSS -o $SKIN_EXPORT_DIR/css/index-embed.css $SKIN_EXPORT_DIR/css/index-embed.css.orig
	fi
fi
)

echo "fetching distribution files"
if [ $MODE = "remote" ]; then
	REVISION_BASE_URL=http://livemodule.betconstruct.com/htmlsport

	REVISIONS_FILE=$TMP_DIR/revisions.txt

	wget -O $REVISIONS_FILE ${REVISION_BASE_URL}/revisions.txt?`date +%s`

	RELEASE_NUMBER=`grep '%%RELEASE_BASE%%' $REVISIONS_FILE | cut -d, -f2 | awk -F'swarm-0.1.|-trunk' '{print $2}' `

	RELEASE_FILE="HTML000-switch_to_swarm-v0.${RELEASE_NUMBER}.tgz"

	echo $RELEASE_NUMBER $RELEASE_FILE
	LOCAL_RELEASE_FILE="$TMP_DIR/$RELEASE_FILE"
	
	wget -O $LOCAL_RELEASE_FILE $REVISION_BASE_URL/$RELEASE_FILE
else

	RELEASE_FILE=HTML000.tgz
	LOCAL_RELEASE_FILE="$TMP_DIR/$RELEASE_FILE"

	cp  ~/dev/vivaro-release/HTML000.tgz $LOCAL_RELEASE_FILE
fi

( cd $TMP_DIR; tar xfz $RELEASE_FILE )

REVISION_DATE=`date +%s`
REVISION_DST_DIR="ver${REVISION_DATE}"

( 
	cd $TMP_DIR; 
	cat HTML000/htmlHelper.js  | sed -e "s/.%VERSION%.);/'${REVISION_DST_DIR}');/g" > htmlHelper.js
	mkdir HTML000/skins
	mv $SKIN_EXPORT_DIR HTML000/skins
	mv HTML000 ${REVISION_DST_DIR}
)

rm $LOCAL_RELEASE_FILE
( 
	cd $TMP_DIR; 
	find $REVISION_DST_DIR -name '*.orig' -delete
)

#cp index_template.html $TMP_DIR/index.html
