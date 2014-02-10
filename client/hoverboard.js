// globals

var MONTHS = [
	'janvier',
	'février',
	'mars',
	'avril',
	'mai',
	'juin',
	'juillet',
	'août',
	'septembre',
	'octobre',
	'novembre',
	'décembre'];

// accounts configuration

Accounts.config({
	sendVerificationEmail: false,
	forbidClientAccountCreation: false,
	loginExpirationInDays: 90
});

Accounts.ui.config({
	passwordSignupFields: 'EMAIL_ONLY'
});

// router

Router.configure({
	layoutTemplate: 'layout',
	loadingTemplate: 'loading',
	notFoundTemplate: '404',
	waitOn: function() { return Meteor.user() && Meteor.subscribe('events') && Meteor.subscribe('shows');}
});

Router.map(function() {
	this.route('hoverboard', {
		path: '/'
	});
});

Router.before(
  // clearSeenMessages filter clears all seen messages. 
  // This filters is applied to all pages 
  function () {
    flash.clear();
  }
);

// flashes

// client only collecion
var flash = flash || {};

// Client only collection
flash.Flashes = new Meteor.Collection(null);

// create given a message and optional type creates a Flash message.
flash.create = function (message, type) {
  type = (typeof type === 'undefined') ? 'danger' : type;
  // Store errors in the 'Errors' local collection
  flash.Flashes.insert({message: message, type: type, seen: false, show: true});
};

// error is a helper function for creating error messages
flash.error= function (message) {
  return flash.create(message, 'danger');
};

// success is a helper function for creating success messages
flash.success = function (message) {
  return flash.create(message, 'success');
};

// info is a helper function for creating info messages
flash.info = function (message) {
  return flash.create(message, 'info');
};

// clear hides viewed message
flash.clear = function () {
  flash.Flashes.update({seen: true}, {$set: {show: false}}, {multi: true});
};

// templates management

// When the template is first created
Template.flashItem.created = function () {
  // Get the ID of the messsage
  var id = this.data._id;
  Meteor.setTimeout(function () {
    // mark the flash as "seen" after 10 milliseconds
    flash.Flashes.update(id, {$set: {seen: true}});
  }, 3000);
}

Template.flashes.flashes = function () {
  return flash.Flashes.find({seen: false});
}

Template.forms.helpers({
	days: function() {
		// returns an array from 1 to 31
		var d = [];
		_.each(_.range(1, 32), function(e, i, l) { d.push(e); });
		return d;
	},

	months: function() {
		// returns the MONTHS array
		return MONTHS;
	},

	years: function() {
		// return an array from currentYear-1 to currentYear+5
		var y = [];
		var curY = new Date().getFullYear();
		_.each(_.range(curY-1, curY+5), function(i) { y.push(i); });
		return y;
	},

	isCurDay: function() {
		return (new Date().getDate() == this) ? ' selected' : '';
	},

	isCurMonth: function() {
		return (MONTHS[new Date().getMonth()] == this) ? ' selected' : '';
	},

	isCurYear: function() {
		return (new Date().getFullYear() == this) ? ' selected' : '';
	},

	getEvent: function(eventId) {
		return Events.findOne({_id: eventId});
	},

	currentEventId: function() {
		return Session.get('currentEventId');
	},

	eventDate: function() {
		date = new Date(this.date);
		return [date.getDate(), MONTHS[date.getMonth()], date.getFullYear()].join(' ');
	}
});

Template.hoverboard.helpers({
	getEvents: function () {
	  return Events.find({userId: Meteor.userId()}, {sort: {date: 1}});
	},

	getShows: function(eventId) {
		return Shows.find({eventId: eventId});
	},

	eventDate: function() {
		date = new Date(this.date);
		return [date.getDate(), MONTHS[date.getMonth()], date.getFullYear()].join(' ');
	},
});

Template.forms.events({
  'click #newDateBtn' : function (e) {
  	e.preventDefault();

  	if (!Meteor.user())
  		return false;

  	var day = $('#newDateDay').val();
  	var month = MONTHS.indexOf($('#newDateMonth').val());
  	var year = $('#newDateYear').val();

  	if (_.isNaN(day) || _.isNaN(month) || _.isNaN(year)) {
  		flash.error('Date invalide');
  		return false;
  	}

		var eventDate = new Date(year, month, day);
		
		if (!Events.findOne({userId: Meteor.userId(), date: eventDate})) {
			Events.insert({userId: Meteor.userId(), date: eventDate}, function(error, result) {
				if (error)
					flash.error("Erreur à l'enregistrement en base de données. L'inseration a été annulée. ("+error+")");
			});
			flash.success('Nouvelle date ajoutée');
		} else
			flash.error('Cette date est déjà enregistrée');
  },

  'click #newShowBtn' : function (e) {
  	e.preventDefault();

  	if (!Meteor.user())
  		return false;

  	var field1 = $('#newField1').val();
  	var field2 = $('#newField2').val();

  	if (!field1 || !field2) {
  		flash.error('Problème avec le champs client ou dj');
  		return false;
  	}

  	var eventId = Session.get('currentEventId');
  	var event = Events.findOne({_id: eventId});

  	if(!event) {
  		flash.error("L'évènement n'existe pas.");
  		return false;
  	}

		Shows.insert({
			userId: Meteor.userId(),
			field1: field1,
			field2: field2,
			eventId: eventId
			}, function(error, result) {
				if (error)
					flash.error("Erreur à l'enregistrement en base de données. L'inseration de la soirée a été annulée. ("+error+")");
		});
		flash.success('Nouvelle soirée ajoutée');
  }
});

Template.hoverboard.events({
	  'click .delete-event': function(e) {
  	e.preventDefault();

  	if (!Meteor.user()) {
  		return false;
  	}

		var eventId = $(e.currentTarget).data('id');
		var event = Events.findOne({_id: eventId});

  	if (!event) {
  		flash.error("L'évènement n'existe pas.");
  		return false;
  	}

		if (event.userId == Meteor.userId()) {
			Meteor.call('deleteEvent', eventId, function(error, result) {
				if (error)
					flash.error("Erreur à la suppression en base de données. La suppression de la date a été annulée. ("+error+")");
				else
					flash.success('Date supprimée');
			});
		} else
			flash.error('Vous ne pouvez pas supprimer cette date');
  },

  'click .delete-show': function(e) {
  	e.preventDefault();

  	if (!Meteor.user()) {
  		return false;
  	}

		var showId = $(e.currentTarget).data('id');
		var show = Shows.findOne({_id: showId});

  	if(!show) {
  		flash.error("La soirée n'existe pas.");
  		return false;
  	}

		if (show.userId == Meteor.userId()) {
			Shows.remove({_id: showId}, function(error, result) {
				if (error)
					flash.error("Erreur à la suppression en base de données. La suppression de la soirée a été annulée. ("+error+")");
			});
			flash.success('Soirée supprimée');
		} else
			flash.error('Vous ne pouvez pas supprimer cette soirée');
  },

  'click .event': function(e) {
  	var eventId = $(e.currentTarget).data('id');
  	if(eventId)
  		Session.set('currentEventId', eventId);
  }
});

Deps.autorun(function () {
	if(Meteor.user()) {
		Meteor.subscribe('events');
		Meteor.subscribe('shows');
	}
});