const yargs = require('yargs');
const moment = require('moment');

const argv = yargs
  .option('list-name', {
    alias: 'l',
    description: 'Nome della lista da stampare',
    type: 'string',
  })
  .help()
    .alias('help', 'h')
    .argv;

const board = require('./trello.json');

const getCard = (id) => board.cards.find(item => item.id === id);
const getList = (id) => board.lists.find(item => item.id === id);
const getChecklist = (id) => board.checklists.find(item => item.id === id);
const getLabel = (id) => board.labels.find(item => item.id === id);

const printCard = (card) => {
  console.log(`> ${card.name}`);
  card.idLabels
  .forEach(labelId => {
    printLabel(getLabel(labelId));
  })
  card.idChecklists
    .forEach(checklistId => {
      printChecklist(getChecklist(checklistId));
    })
  board.actions
    .filter(action => action.data.card && action.data.card.id === card.id && action.type === 'commentCard')
    .forEach(comment => {
      printComments(comment);
  })
}

const printLabel = (label) => console.log(`    @ ${label.name}`);

const printChecklist = (checklist) => {
  console.log(`    ${checklist.name}`);
  checklist.checkItems
    .sort((a,b) => a.pos - b.pos)
    .forEach(item => {
      console.log(`     - ${item.name} ${item.state === 'complete' ? ' - DONE' : ''}`);
    });
}

const printComments = (comment) => {
  const {memberCreator, date, data} = comment;
  console.log(` * ${moment(date).calendar()}, ${memberCreator.fullName}:\n   ${data.text}`);
  // console.log('*', memberCreator.fullName, date, data.text);
}

const printList = (listId, listName = undefined) => {
  let list;
  if (listName) list = board.lists.find(list => list.name === listName);
  else list = getList(listId);
  
  if (!list || list.closed) return;

  let id = list.id;
  console.log(`>>> ${list.name} <<<`);
  board.cards.filter(card => card.idList === list.id && card.closed === false).forEach(card => {
    printCard(card);
  })
}

const initMoment = () => {
  moment.locale('it');
  moment.locale('it', {
    calendar : {
        lastDay : '[ieri alle] LT',
        sameDay : 'LT',
        nextDay : '[domani alle] LT',
        lastSunday : '[domenica scorsa alle] LT',
        lastWeek : 'dddd [scorso alle] LT',
        nextWeek : 'dddd [alle] LT',
        sameElse : 'L [alle] LT'
    }
  });  

  moment.calendarFormat = function (myMoment, now) {
    let diff = myMoment.diff(now, 'days', true);
    let retVal;

    if (diff < -6) retVal = myMoment.format('llll');
    else if (diff < -1) {
      if (myMoment.format('dddd') === 'domenica')
        retVal = 'lastSunday';
      else
        retVal = 'lastWeek';
    }
    else if (diff < 0) retVal = 'lastDay';
    else if (diff < 1) retVal = 'sameDay';
    else if (diff < 2) retVal = 'nextDay';
    else if (diff < 7) retVal = 'nextWeek';
    else retVal = 'sameElse';
    
    return retVal;
  };
}

if (require.main === module) {
  initMoment();
  if (argv.listName) printList(null, argv.listName);
  else board.lists.forEach(list => printList(list.id));
}

