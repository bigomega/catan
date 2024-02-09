git stash
mv ./views/static-shuffler.html ./public/index.html
git add .
git commit -m "tmp"
npx push-dir --dir=public --branch=gh-pages
git reset --soft HEAD~
git reset
mv ./public/index.html ./views/static-shuffler.html
git stash pop
