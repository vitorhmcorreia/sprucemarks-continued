#!/bin/sh
# Test .githooks/install in throwaway repositories: a missing hook, an empty hook, an existing hook that ends in
# "exit 0", running twice, and that switching branches really rewrites deploy/build-info.json. Run: sh test/hooks-install.sh
set -u
root=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

repo="$work/repo"
git init -q -b main "$repo"
cd "$repo"
git config user.email test@example.invalid
git config user.name test
mkdir -p deploy .githooks
cp "$root/.githooks/install" "$root/.githooks/write-build-info" .githooks/
echo '{}' > deploy/manifest.json
git add . && git commit -q -m one
hooks=$(git rev-parse --git-path hooks)

printf '#!/bin/sh\n' > "$hooks/post-merge"                                  # empty hook (the bug of 2026-11-14)
printf '#!/bin/sh\necho existing\nexit 0\n' > "$hooks/post-rewrite"         # existing hook ending in exit
rm -f "$hooks/post-checkout"                                                # no hook at all

sh .githooks/install > /dev/null
sh .githooks/install > /dev/null                                            # twice

for h in post-checkout post-merge post-rewrite post-commit; do
    check "$h has the line exactly once" "[ \$(grep -c 'sprucemarks build-info' '$hooks/$h') -eq 1 ]"
    check "$h line comes right after the first line" "sed -n 2p '$hooks/$h' | grep -q 'sprucemarks build-info'"
    check "$h is executable" "[ -x '$hooks/$h' ]"
done
check "existing hook content kept" "grep -q '^echo existing$' '$hooks/post-rewrite' && grep -q '^exit 0$' '$hooks/post-rewrite'"
check "no temp files left" "! ls '$hooks' | grep -q tmp"

git switch -q -c other
echo change > file.txt && git add file.txt && git commit -q -m two
rm -f deploy/build-info.json
git switch -q main
check "switch rewrites build-info.json" "grep -q '\"branch\": \"main\"' deploy/build-info.json"
rm -f deploy/build-info.json
git merge -q --ff-only other
check "merge (pull) rewrites build-info.json" "grep -q \"\$(git rev-parse --short HEAD)\" deploy/build-info.json"

git switch -q -c conflict-a main && echo a > c.txt && git add c.txt && git commit -q -m a
git switch -q -c conflict-b main && echo b > c.txt && git add c.txt && git commit -q -m b
git merge -q conflict-a > /dev/null 2>&1    # conflicts: post-merge does not run
echo resolved > c.txt && git add c.txt && rm -f deploy/build-info.json
git commit -q --no-edit                      # finishing the merge by hand runs post-commit
check "merge finished by hand rewrites build-info.json" "grep -q \"\$(git rev-parse --short HEAD)\" deploy/build-info.json"

exit $fail
