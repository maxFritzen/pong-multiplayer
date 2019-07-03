function deparam (searchUri) {
  if (searchUri === undefined) {
    searchUri = window.location.search;
  }
  // remove any preceding url and split
  
  var querystring = searchUri.substring(searchUri.indexOf('?')+1).split('&');
  var params = {}, pair, d = decodeURIComponent, i;
  // march and parse
  for (i = querystring.length; i > 0;) {
    pair = querystring[--i].split('=');
    params[d(pair[0])] = d(pair[1]);
  }

  return params;
}

export { deparam };