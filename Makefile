DC=docker-compose
DCS=docker-compose exec -T app
DCM=docker-compose exec -T mariadb

ALIAS?=alias
Darwin:
	sudo ifconfig lo0 $(ALIAS) $(shell awk '$$1 ~ /^DEV_IP/' .env | sed -e "s/^DEV_IP=//")
Linux:
	@echo 'skipping ...'
.lo0-up:
	-@make `uname`
.lo0-down:
	-@make `uname` ALIAS='-alias'
.env:
	sed -e "s/{DEV_UID}/$(shell if [ "$(shell uname)" = "Linux" ]; then echo $(shell id -u); else echo '1001'; fi)/g" \
		-e "s/{DEV_GID}/$(shell if [ "$(shell uname)" = "Linux" ]; then echo $(shell id -g); else echo '1001'; fi)/g" \
		.env.dist > .env; \

init: docker-up-force pnpm-install

publish:
	npx pnpm build || true
	npx pnpm publish

docker-compose.ci.yml:
	# Comment out any port forwarding
	sed -r 's/^(\s+ports:)$$/#\1/g; s/^(\s+- \$$\{DEV_IP\}.*)$$/#\1/g' docker-compose.yaml > docker-compose.ci.yml

docker-up-force: .env .lo0-up
	$(DC) pull --ignore-pull-failures
	$(DC) up -d --build --force-recreate --remove-orphans
	$(DC) run --rm wait-for-it mariadb:3306 -t 600
	$(DCM) mysql -proot -e "create database if not exists test"

docker-down-clean: .env .lo0-down
	docker-compose down -v

start:
	$(DCS) pnpm start

pnpm-install:
	$(DCS) pnpm install

pnpm-update:
	$(DCS) pnpm upgrade

pnpm-outdated:
	$(DCS) pnpm outdated

pnpm-rebuild:
	$(DCS) pnpm rebuild

lint:
	$(DCS) pnpm lint-ci

unit:
	$(DCS) pnpm test

fasttest: lint unit

localtest:
	pnpm run lint
	pnpm run test

test: docker-up-force pnpm-install fasttest docker-down-clean
