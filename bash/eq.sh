VERBOSE=0

if [[ $1 == -v ]]; then
  VERBOSE=1
  shift
fi

for FN in "$@"; do
  if (($VERBOSE == 1)); then
    echo change $FN
  fi
  echo normal
done