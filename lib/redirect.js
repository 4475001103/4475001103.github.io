// Forwards visitors who land on the bare homepage (svenfranck.eu) to the
// campaign, which is now the homepage in each language. English visitors are
// sent to /en/, German visitors to /de/, and French visitors stay here. If
// their language is none of these, the English homepage is used.

(function () {
  var homeByLanguage = {
    fr: "/",
    en: "/en/",
    de: "/de/"
  };

  // The visitor's preferred languages, most preferred first.
  var preferred = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || ""];

  // English is the default if none of the visitor's languages match.
  var target = homeByLanguage.en;
  for (var i = 0; i < preferred.length; i += 1) {
    var code = preferred[i].slice(0, 2).toLowerCase();
    if (homeByLanguage[code]) {
      target = homeByLanguage[code];
      break;
    }
  }

  // French content already lives here at the root, so only the others need
  // forwarding. Replace the page (rather than add to history) so the browser's
  // Back button skips this forwarding step.
  if (target !== "/") {
    window.location.replace(target);
  }
}());
