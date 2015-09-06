/*
 * Copyright (c) 2015 Mostafa Abdelraouf <mostafa.mohmmed@gmail.com> 
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

 var GridBuilder = (function(){
    
    var mIsFirstCall = true;
    var mSelf = null;
    var mCurrentPath = [];
    var mPathTable = [];
    var mCellMap = {};
    var mTopSequence = "";
    var mSideSequence = "";
    var mDomGridTable = null;
    var mDomAlignmentTable = null;
    var mDomContainer = null;
    var mGapSymbol = "-";
    var mIsCustomPathMode = false;
    
    function onCellClicked(dom, x, y){
    
        var x = parseInt(x);
        var y = parseInt(y);
        
        var lastElement = null;
        if(mCurrentPath != null && mCurrentPath.length != 0){
                //If we are not in an empty path, check to see if this is an allowed move
                //We can move one step up, right, or diagonally up and to the right from any point on the grid 
                lastElement = mCurrentPath[mCurrentPath.length - 1];
                
                if(dom.hasClass('in-path')){

                    //Just on entry? Clear path
                    if(mCurrentPath.length == 1){
                        mCurrentPath[0].dom.removeClass('in-path');
                        mCurrentPath[0].dom.removeClass('is-last');
                        mCurrentPath[0].dom.removeAttr('data-index');
                        mCurrentPath = [];
                        onPathUpdate();
                        return true;
                    }
                    
                    var indexInPath = parseInt(dom.attr('data-index'));
                    var newPath = [];
                    for(i=indexInPath+1; i<mCurrentPath.length; i++){
                        mCurrentPath[i].dom.removeClass('in-path');
                        mCurrentPath[i].dom.removeClass('is-last');
                        mCurrentPath[i].dom.removeAttr('data-index');
                    }
                    mCurrentPath.splice(indexInPath+1, mCurrentPath.length - indexInPath + 1);
                    mCurrentPath[mCurrentPath.length-1].dom.addClass('is-last');
                    onPathUpdate();
                    return true;
                }
                
                //An attempt to move in the wrong direction
                if(lastElement.x < x || lastElement.y < y){
                    return false;
                }
            
                if(x - lastElement.x < -1 || y - lastElement.y < -1){
                    return false;
                }
                
                
        }
        
        
        dom.attr('data-index', mCurrentPath.length);
        
        mCurrentPath.push({
            'idx' : mCurrentPath.length,
            'x' : x, 
            'y' : y,
            'dom' : dom,
            'previous' : lastElement
        });
        
        if(lastElement){
            lastElement.dom.removeClass('is-last');
        }
        
        dom.addClass('is-last');
        dom.addClass('in-path');
        onPathUpdate();
        return true;
        
    }

    function onPathUpdate(){
        
        //console.log("Path Updated ========");
        var alignedTopSeq = '';
        var alignedSideSeq = '';
        
        
        for(i=mCurrentPath.length - 1;i>=0;i--){

            var currentCell = mCurrentPath[i];
            var nextCell = (i>0)?mCurrentPath[i-1]:null;
            
            var topChar =  mTopSequence[currentCell.x];
            var sideChar = mSideSequence[currentCell.y];

            if(!nextCell){
                continue;
            }
            

            //Diagonal move
            if(nextCell.x - currentCell.x > 0 && nextCell.y - currentCell.y > 0){
                alignedTopSeq += topChar;
                alignedSideSeq += sideChar;
                continue;
            }
            
            //Horizontal move
            if(nextCell.x - currentCell.x > 0){
                sideChar = mGapSymbol;
            }
            
            //Vertical move
            if(nextCell.y - currentCell.y > 0){
                topChar = mGapSymbol;
            }

            alignedTopSeq += topChar;
            alignedSideSeq += sideChar;
            
        }

        $('#alignment').remove();
        
        mDomAlignmentTable = $table = $('<table />').attr('id', 'alignment');
        //mDomAlignmentTable.width( mDomGridTable.width() );
        
        var score = 0;
        var $tr = $('<tr />');
        for(idxTop in alignedTopSeq){
                var c1 = alignedTopSeq[idxTop];
                var c2 = alignedSideSeq[idxTop];
                
                if(c1 == mGapSymbol || c2 == mGapSymbol){
                    //console.log('GAP ' + score + " + " + mGapScore + "=" + (score+mGapScore));
                    score += mGapScore;
                } else if(c1 == c2){
                    //console.log('MAT ' + score + " + " + mMatchScore + "=" + (score+mMatchScore));
                    score += mMatchScore;
                } else {
                    //console.log('MIS' + score + " + " + mMismatchScore + "=" + (score+mMismatchScore));
                    score += mMismatchScore;
                }
                $tr.append($('<td />').html(c1));
        }
        $table.append($tr);
        
        var $tr = $('<tr />');
        for(idxSide in alignedSideSeq){
            $tr.append($('<td />').html(alignedSideSeq[idxSide]));
        }
        $table.append($tr);

        var $tr = $('<tr />');
        $tr.append($('<td colspan="1500" class="score" />').html("Score = " + score));
        $table.append($tr);
        
        mDomResultContainer.append($table);
        
    }

	function displayTooltip(text, x, y){

        var title = "";
		if($('#tooltip').length == 0){
			$('body').prepend( $('<div />').attr('id', 'tooltip') );
		}
		var tt = $('#tooltip').html("");
		tooltipHeight = 30;

		var xBorder = x + tt.width() + 30;
		if( xBorder > $(window).width())x -= (  xBorder - $(window).width() );

		var yBorder = y + tt.height() + 30;
		if( yBorder > $(window).height())y -= ( tooltipHeight * 2);

        tt.append(text);
		tt.css('left', x);
		tt.css('top' , y);
		tt.css('display', 'block');
	};

	function hideTooltip(){
		$( '#tooltip' ).css('display', 'none');
	};
    
    function showTooltip(x, y){
        
        var targetCell = mCellMap[x + "_" + y];
        var $table = $("<table />");

        var $tr = $("<tr />");
        $tr.append(
            $("<td />").html("Score from Diagonal cell = " + targetCell.diagonalScoreText)
        ).append(
            $("<td />").html("Score from Upper cell = " + targetCell.upScoreText)
        )
        $table.append($tr);
        
        var $tr = $("<tr />");
        $tr.append(
            $("<td />").html("Score from Side cell = " + targetCell.sideScoreText)
        ).append(
            $("<td />").html(targetCell.winningScore)
        );
        $table.append($tr);
        
        $('#' + (x-1) + '_' + (y-1)).addClass('highlight');
        $('#' + (x-0) + '_' + (y-1)).addClass('highlight');
        $('#' + (x-1) + '_' + (y-0)).addClass('highlight');
        
        var targetDom = $('#' + x + '_' + y);
        var pos = targetDom.offset();
        targetDom.addClass('highlight-main');
        displayTooltip($table, pos.left + targetDom.width() + 10, pos.top - targetDom.height() / 2);
    }
    
    function dirToArrow(d){
        switch(d){
            case 'u': return ' &uArr; ';
            case 's': return ' &lArr; ';
            case 'd': return  ' &#8662;' ;
            default : return '';
        }
    }
    
    function constructNRow(n){
        var charIndex = parseInt(n) - 1;
        var $tr = $('<tr />');

        if(charIndex >= 0){
            var $th = $('<th />');
            $th.html(mSideSequence[charIndex]);
            $tr.append($th);
        } else {
            var $th = $('<th />');
            $tr.append($th);
        }
        
        var $td = $('<td />');
        $td.html(
            //0 + "_" + n
            dirToArrow(mCellMap[0 + "_" + n]['direction']) + 
            mCellMap[0 + "_" + n]['winningScore'] 
        );
        $td.attr('data-x', 0);
        $td.attr('data-y', n);
        $td.attr('id', 0 + "_" + n);
        $tr.append($td);
        
        for(idx in mTopSequence){
            idx = parseInt(idx);
            var dataPointIndex = (idx + 1) + '_' + (charIndex+1);
            var $td = $('<td />');
            //console.log(dataPointIndex);
            $td.html(
                //dataPointIndex
                dirToArrow(mCellMap[dataPointIndex]['direction']) +
                mCellMap[dataPointIndex]['winningScore']
            );
            $td.attr('data-x', (idx + 1));
            $td.attr('data-y', (charIndex + 1));
            $td.attr('data-dg', mCellMap[dataPointIndex]['diagonalScoreText']);
            $td.attr('data-up', mCellMap[dataPointIndex]['upScoreText']);
            $td.attr('data-sd', mCellMap[dataPointIndex]['sideScoreText']);

            $td.attr('id', dataPointIndex);
            $tr.append($td);
        }
        
        $table.append($tr)
        mDomContainer.append($table);
        
    }
    
    
    function constructGrid(){
        
        $('#alignment').remove();
        $('#grid').remove();
        mDomGridTable = $table = $('<table />').attr('id', 'grid');
        mDomContainer.append($table);

        var $tr = $('<tr />');

        var $th = $('<th />');
        $tr.append($th);

        var $th = $('<th />');
        $tr.append($th);
        
        for(idx in mTopSequence){
            $th = $('<th />');
            $th.html(mTopSequence[idx]);
            $tr.append($th);
        }
        
        $table.append($tr)

        for(i=0;i<mSideSequence.length + 1;i++){
            constructNRow(i);
        }
        
        $('#grid td').click(function(){
            var self = $(this);
            onCellClicked(
                self,
                self.attr('data-x'),
                self.attr('data-y')
            );
        });
        
        $('#grid td').hover(function(){
            console.log(mIsCustomPathMode);
            if(mIsCustomPathMode){
                return;
            }
            var self = $(this);
            var x = self.attr('data-x');
            var y = self.attr('data-y');
            if(x < 1 || y < 1){
                return;
            }
            showTooltip(x, y);
        }, function(){
            $('#grid td').removeClass('highlight');
            $('#grid td').removeClass('highlight-main');
            hideTooltip();
        });


    }

    
    mSelf = {
         
         highlightOptimal : function(){
             
            mIsCustomPathMode = false;
            var width = mTopSequence.length + 1;
            var height = mSideSequence.length + 1;
            
            var currentX = width - 1;
            var currentY = height - 1;
            var steps = 15;
            while(currentX > -1 && currentY > -1){
                var currentCell = mCellMap[currentX + '_' + currentY];
                var currentDom = $('#' + currentX + '_' + currentY);

                currentDom.click();
                switch(currentCell.direction){
                    default:
                    case 'd':
                        currentX--;
                        currentY--;
                        break;
                    case 's':
                        currentX--;
                        break;
                    case 'u':
                        currentY--;
                        break;
                }
                
            }
            
            
         },
         
        startCustomPath : function(){
            this.rebuildTable(mDomContainer, mDomResultContainer, mMatchScore, mMismatchScore, mGapScore, mSideSequence, mTopSequence);
            mIsCustomPathMode = true;
        },
        
        rebuildTable : function(domContainer, resultContainer, matchScore, mismatchScore, gapScore, seqSide, seqTop){
    
            if(mIsFirstCall){
                $(window).mousemove(function(e){
                    window.mouseXPos = e.pageX;
                    window.mouseYPos = e.pageY;
                });
                mIsFirstCall = false;
            }
    
            seqTop = seqTop.toUpperCase();
            seqSide= seqSide.toUpperCase();
            mCurrentPath = [];
            mDomContainer = domContainer;
            mDomResultContainer = resultContainer;
            mTopSequence = seqTop;
            mSideSequence = seqSide;
            mMatchScore = matchScore;
            mMismatchScore = mismatchScore;
            mGapScore = gapScore;
            
            var width = mTopSequence.length + 1;
            var height = mSideSequence.length + 1;
            
            for(i=0;i<width;i++){
                mPathTable[i] = [];
                for(j=0;j<height;j++){
                
                    if(i == 0 && j == 0){
                        mPathTable[i][j] = 0;
                        mCellMap[i + "_" + j] = {
                            'winningScore' : mPathTable[i][j]
                        }
                        continue;
                    }
                    
                    if(i == 0){
                        mPathTable[i][j] = j * gapScore;
                        mCellMap[i + "_" + j] = {
                            'winningScore' : mPathTable[i][j]
                        }
                        continue;
                    }

                    if(j == 0){
                        mPathTable[i][j] = i * gapScore;
                        mCellMap[i + "_" + j] = {
                            'winningScore' : mPathTable[i][j]
                        }
                        continue;
                    }
                    
                    var isMatch = mTopSequence[i-1] == mSideSequence[j-1];
                    var comparisonScore = isMatch?matchScore:mismatchScore;
                    /*
                    console.log(
                        "Processing cell(" + i + ", " + j + ")\n" 
                        + "Side score is " + (mPathTable[i-1][j] + gapScore) + "\n"
                        + "Up score is " + (mPathTable[i][j-1] + gapScore) + "\n"
                        + "Diag score is " + (comparisonScore + mPathTable[i-1][j-1]) + "\n"
                    );
                    */
                    var moveUpScore = mPathTable[i][j-1] + gapScore;
                    var moveSdScore = mPathTable[i-1][j] + gapScore;
                    var moveDgScore = parseInt(comparisonScore) + parseInt(mPathTable[i-1][j-1]);
                    mPathTable[i][j] =  Math.max(moveUpScore, moveSdScore, moveDgScore);
                    
                    /*
                    This is important when the values collide
                    That is, we have two ways that both have the same score
                    The PHP implemention does something that works which is
                    
                    It assigns the diagonal the lowest priority, then the up score and then the side scores
                    
                    */
                    var direction = 'd';
                    if(mPathTable[i][j] == moveUpScore) {
                        direction = 'u';
                    } else if(mPathTable[i][j] == moveSdScore) {
                        direction = 's';
                    }
                       
                    mCellMap[i + "_" + j] = {
                        'sideScoreText' : mPathTable[i-1][j] + " + " + gapScore + " (The Gap score) = " + moveSdScore,
                        'upScoreText' : mPathTable[i][j-1] + " + " + gapScore + " (The Gap score) = " + moveUpScore,
                        'diagonalScoreText' : 
                            parseInt(comparisonScore) 
                            +" (Due to a " + (isMatch?"match":"mismatch") 
                            +" between " + mTopSequence[i-1] + "&" +  mSideSequence[j-1] + ") "  
                            + "+" + mPathTable[i-1][j-1] + " = " 
                            + moveDgScore,
                        'sideScore': moveSdScore, 
                        'upScore': moveUpScore,
                        'diagonalScore' : moveDgScore,
                        'winningScore' : mPathTable[i][j],
                        'direction': direction
                    }
                    
                }
            }
            
            constructGrid();
        }
        
    };
    
    return mSelf;
    
}());