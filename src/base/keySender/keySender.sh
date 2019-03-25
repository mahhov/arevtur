ACTION_RELEASE=-1
ACTION_PRESS=-2
ACTION_TYPE=-3
ACTION_COMBO=-4
ACTION_END=-5

while read keys; do
  keys=($keys $ACTION_END)

  action=0;
  i=0;
  lastActionI=0;

  while [ $i -lt ${#keys[@]} ]; do
    key=${keys[i]}
    if [ $key -lt 0 2> /dev/null ]; then
      if [ $action -eq $ACTION_COMBO ]; then
        i=$lastActionI;
        action=$ACTION_RELEASE;
      else
        action=$key;
      fi
      lastActionI=$i;
    else
      case $action in
        $ACTION_RELEASE)
          xdotool keyup $key
          ;;
        $ACTION_PRESS|$ACTION_COMBO)
          xdotool keydown $key
          ;;
        $ACTION_TYPE)
          xdotool keydown $key
          xdotool keyup $key
          ;;
      esac
    fi
    ((i++))
  done
done
